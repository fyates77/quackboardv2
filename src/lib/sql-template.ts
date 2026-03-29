import type { DashboardFilter } from "@/types/dashboard";

/**
 * Applies dashboard filters to a SQL query.
 *
 * Two mechanisms, applied in order:
 * 1. Template replacement: {{filter_name}} placeholders are replaced inline.
 * 2. Automatic WHERE injection: for any active filter NOT handled by a
 *    template, the query is wrapped in a subquery with WHERE clauses.
 *
 * This means filters "just work" on any SQL — no template syntax required.
 * Power users can still use {{name}} for precise control (e.g. in JOINs).
 */
export function applyFilters(
  sql: string,
  filters: DashboardFilter[],
  filterValues: Record<string, string>,
): string {
  const handledByTemplate = new Set<string>();

  // Step 1: Replace {{name}} templates
  let result = sql.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    handledByTemplate.add(name);
    const value = filterValues[name];
    if (value === undefined || value === "") return "1=1";
    const escaped = value.replace(/'/g, "''");
    return `'${escaped}'`;
  });

  // Step 2: Auto-inject WHERE for filters not handled by templates
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
