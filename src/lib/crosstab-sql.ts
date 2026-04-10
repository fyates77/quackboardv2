type AggFn = "sum" | "avg" | "count" | "min" | "max";

/**
 * Generates a DuckDB native PIVOT statement from crosstab config.
 * The sourceSql is wrapped as a subquery — DuckDB aggregates in-engine.
 */
export function buildCrosstabPivotSQL({
  sourceSql,
  rowDim,
  colDim,
  measure,
  aggFn = "sum",
}: {
  sourceSql: string;
  rowDim: string;
  colDim: string;
  measure: string;
  aggFn?: AggFn;
}): string {
  const agg = aggFn.toUpperCase();
  // COUNT doesn't need a column argument; all others do.
  const using = aggFn === "count" ? `COUNT(*)` : `${agg}("${measure}")`;
  return [
    `PIVOT (`,
    `  ${sourceSql.trim()}`,
    `)`,
    `ON "${colDim}"`,
    `USING ${using}`,
    `GROUP BY "${rowDim}"`,
  ].join("\n");
}

export function isCrosstabReady(opts: {
  crosstabSourceSql?: string;
  crosstabRowDim?: string;
  crosstabColDim?: string;
  crosstabMeasure?: string;
}): boolean {
  return !!(
    opts.crosstabSourceSql?.trim() &&
    opts.crosstabRowDim &&
    opts.crosstabColDim &&
    opts.crosstabMeasure
  );
}
