import type { DashboardFilter } from "@/types/dashboard";

/**
 * Applies dashboard filters and parameters to a SQL query.
 *
 * Three mechanisms, applied in order:
 * 1. Parameter replacement: {{param_name}} that match a parameter name are
 *    substituted with the parameter value (numeric values unquoted, strings quoted).
 * 2. Filter template replacement: remaining {{filter_name}} placeholders are
 *    replaced inline with quoted filter values.
 * 3. Automatic WHERE injection: for any active filter NOT handled by a
 *    template, the query is wrapped in a subquery with WHERE clauses.
 *
 * This means filters "just work" on any SQL — no template syntax required.
 * Power users can still use {{name}} for precise control (e.g. in JOINs).
 */
export function applyFilters(
  sql: string,
  filters: DashboardFilter[],
  filterValues: Record<string, string>,
  parameterValues?: Record<string, string | number | boolean>,
): string {
  const handledByTemplate = new Set<string>();

  // Step 1 + 2: Replace {{name}} templates (parameters first, then filters)
  let result = sql.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    // Check parameters first
    if (parameterValues && name in parameterValues) {
      handledByTemplate.add(name);
      const pval = parameterValues[name];
      if (typeof pval === "number") return String(pval);
      if (typeof pval === "boolean") return pval ? "TRUE" : "FALSE";
      const escaped = String(pval).replace(/'/g, "''");
      return `'${escaped}'`;
    }

    // Then check filters
    handledByTemplate.add(name);
    const value = filterValues[name];
    if (value === undefined || value === "") return "1=1";
    const escaped = value.replace(/'/g, "''");
    return `'${escaped}'`;
  });

  // Step 3: Auto-inject WHERE for filters not handled by templates
  const whereConditions: string[] = [];
  for (const filter of filters) {
    const value = filterValues[filter.name];
    if (!value || !filter.column) continue;
    if (handledByTemplate.has(filter.name)) continue;

    const escaped = value.replace(/'/g, "''");
    const col = filter.column.replace(/"/g, '""');
    whereConditions.push(`"${col}" = '${escaped}'`);
  }

  if (whereConditions.length > 0) {
    result = `SELECT * FROM (${result}) AS __filtered WHERE ${whereConditions.join(" AND ")}`;
  }

  return result;
}
