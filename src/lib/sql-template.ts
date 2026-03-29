/**
 * Replaces {{filter_name}} placeholders in SQL with current filter values.
 * Unmatched placeholders are replaced with '1=1' (no-op) so queries still run
 * when a filter has no value selected.
 */
export function interpolateFilters(
  sql: string,
  filterValues: Record<string, string>,
): string {
  return sql.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    const value = filterValues[name];
    if (value === undefined || value === "") return "1=1";
    // Escape single quotes in the value to prevent SQL injection
    const escaped = value.replace(/'/g, "''");
    return `'${escaped}'`;
  });
}
