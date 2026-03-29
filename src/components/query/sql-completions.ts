import type { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import type { QueryEngine } from "@/engine/types";

/**
 * Creates a CodeMirror completion source that provides table and column
 * name completions from the DuckDB engine.
 */
export function createSchemaCompletionSource(engine: QueryEngine) {
  // Cache schema info so we don't query DuckDB on every keystroke
  let cache: { tables: string[]; columns: Map<string, string[]> } | null = null;
  let cacheTime = 0;
  const CACHE_TTL = 5_000; // refresh every 5s

  async function loadSchema() {
    const now = Date.now();
    if (cache && now - cacheTime < CACHE_TTL) return cache;

    try {
      const tables = await engine.listTables();
      const columns = new Map<string, string[]>();
      for (const table of tables) {
        const cols = await engine.describeTable(table);
        columns.set(table, cols.map((c) => c.name));
      }
      cache = { tables, columns };
      cacheTime = now;
    } catch {
      // If engine isn't ready, return empty
      if (!cache) cache = { tables: [], columns: new Map() };
    }
    return cache;
  }

  return async function schemaCompletion(
    context: CompletionContext,
  ): Promise<CompletionResult | null> {
    // Match word characters, dots for table.column
    const word = context.matchBefore(/[\w.]+/);
    if (!word && !context.explicit) return null;

    const schema = await loadSchema();
    const from = word?.from ?? context.pos;
    const text = word?.text ?? "";

    // If text contains a dot, complete column names for that table
    const dotIdx = text.lastIndexOf(".");
    if (dotIdx >= 0) {
      const tableName = text.slice(0, dotIdx);
      const cols = schema.columns.get(tableName) ?? [];
      return {
        from: from + dotIdx + 1,
        options: cols.map((col) => ({
          label: col,
          type: "property",
        })),
      };
    }

    // Otherwise, offer both table names and all column names
    const options: { label: string; type: string; detail?: string }[] = [];

    for (const table of schema.tables) {
      options.push({ label: table, type: "class", detail: "table" });
    }

    for (const [table, cols] of schema.columns) {
      for (const col of cols) {
        options.push({ label: col, type: "property", detail: table });
      }
    }

    return { from, options };
  };
}
