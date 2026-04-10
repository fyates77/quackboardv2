import type { BuilderConfig, BuilderFilter, AggFn } from "@/types/builder";

function q(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function aggExpr(col: string, fn: AggFn): string {
  if (fn === "count") return "COUNT(*)";
  if (fn === "count_distinct") return `COUNT(DISTINCT ${q(col)})`;
  return `${fn.toUpperCase()}(${q(col)})`;
}

function filterClause(f: BuilderFilter): string {
  if (f.op === "IS NULL") return `${q(f.column)} IS NULL`;
  if (f.op === "IS NOT NULL") return `${q(f.column)} IS NOT NULL`;
  const raw = f.value ?? "";
  if (f.op === "IN" || f.op === "NOT IN") {
    // Expect comma-separated values; quote each one if non-numeric
    const parts = raw.split(",").map((v) => {
      const t = v.trim();
      return /^-?\d+(\.\d+)?$/.test(t) ? t : `'${t.replace(/'/g, "''")}'`;
    });
    return `${q(f.column)} ${f.op} (${parts.join(", ")})`;
  }
  if (f.op === "LIKE") return `${q(f.column)} LIKE '${raw.replace(/'/g, "''")}'`;
  // = != > < >= <=
  const numeric = /^-?\d+(\.\d+)?$/.test(raw.trim());
  const literal = numeric ? raw.trim() : `'${raw.replace(/'/g, "''")}'`;
  return `${q(f.column)} ${f.op} ${literal}`;
}

export function buildSQL(cfg: BuilderConfig): string {
  if (!cfg.table) return "";

  const hasMeasures = cfg.measures.length > 0;
  const hasDimensions = cfg.dimensions.length > 0;

  const selectParts: string[] = [];
  for (const d of cfg.dimensions) selectParts.push(q(d.column));
  for (const m of cfg.measures) {
    const expr = aggExpr(m.column, m.aggFn);
    const alias = m.alias || (m.aggFn === "count" ? "count" : `${m.aggFn}_${m.column}`);
    selectParts.push(`${expr} AS ${q(alias)}`);
  }
  // If neither, select all
  if (selectParts.length === 0) selectParts.push("*");

  const lines: string[] = [];
  lines.push(`SELECT ${selectParts.join(",\n       ")}`);
  lines.push(`FROM ${q(cfg.table)}`);

  const validFilters = cfg.filters.filter((f) => {
    if (!f.column) return false;
    if (f.op === "IS NULL" || f.op === "IS NOT NULL") return true;
    return (f.value ?? "").trim() !== "";
  });
  if (validFilters.length > 0) {
    const clauses = validFilters.map(filterClause);
    lines.push(`WHERE ${clauses.join("\n  AND ")}`);
  }

  if (hasMeasures && hasDimensions) {
    lines.push(`GROUP BY ${cfg.dimensions.map((d) => q(d.column)).join(", ")}`);
  }

  if (cfg.orderByColumn) {
    lines.push(`ORDER BY ${q(cfg.orderByColumn)} ${cfg.orderByDir ?? "DESC"}`);
  }

  if (cfg.limit) {
    lines.push(`LIMIT ${cfg.limit}`);
  }

  return lines.join("\n");
}
