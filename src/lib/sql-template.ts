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

/**
 * Apply cross-filter WHERE clauses from chart click interactions.
 * Wraps the query in a subquery with WHERE conditions for each active cross-filter.
 */
export function applyCrossFilters(
  sql: string,
  crossFilters: Array<{ column: string; value: string | number }>,
  listenColumns?: string[],
): string {
  if (crossFilters.length === 0) return sql;

  const conditions: string[] = [];
  for (const cf of crossFilters) {
    // If listenColumns is specified, only apply matching columns
    if (listenColumns && listenColumns.length > 0 && !listenColumns.includes(cf.column)) {
      continue;
    }
    const col = cf.column.replace(/"/g, '""');
    if (typeof cf.value === "number") {
      conditions.push(`"${col}" = ${cf.value}`);
    } else {
      const escaped = String(cf.value).replace(/'/g, "''");
      conditions.push(`"${col}" = '${escaped}'`);
    }
  }

  if (conditions.length === 0) return sql;
  return `SELECT * FROM (${sql}) AS __crossfiltered WHERE ${conditions.join(" AND ")}`;
}

/**
 * Apply drilldown WHERE clauses from the drilldown stack.
 */
export function applyDrilldownFilters(
  sql: string,
  drilldownStack: Array<{ column: string; value: string }>,
): string {
  if (drilldownStack.length === 0) return sql;

  const conditions = drilldownStack.map((entry) => {
    const col = entry.column.replace(/"/g, '""');
    const val = entry.value.replace(/'/g, "''");
    return `"${col}" = '${val}'`;
  });

  return `SELECT * FROM (${sql}) AS __drilled WHERE ${conditions.join(" AND ")}`;
}
