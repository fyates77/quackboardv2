import { useMemo } from "react";
import type { QueryResult } from "@/engine/types";
import type { GroupedTableColumn, ColumnFormat, VisualizationOptions } from "@/types/dashboard";
import { formatNumber, evaluateThresholds } from "@/lib/format-number";

interface GroupedTableProps {
  result: QueryResult;
  options: VisualizationOptions;
  onClickDatum?: (datum: { column: string; value: unknown }) => void;
}

type DataRow = Record<string, unknown>;
type ProcessedRow = DataRow & { _isSubtotal?: boolean; _subtotalLevel?: number; _isGrandTotal?: boolean };

/** Format a cell value according to ColumnFormat settings */
function formatCell(value: unknown, fmt?: ColumnFormat): string {
  if (value == null) return "";
  if (typeof value === "number" && fmt?.numberFormat && fmt.numberFormat !== "auto") {
    return formatNumber(value, fmt.numberFormat, {
      decimals: fmt.decimals,
      currencyCode: fmt.currencyCode,
    });
  }
  if (typeof value === "number" && fmt?.decimals !== undefined) {
    return formatNumber(value, "auto", { decimals: fmt.decimals });
  }
  return String(value);
}

/**
 * Recursively build subtotal rows for computed mode.
 * Inserts a subtotal row after each group at each non-leaf dimension level.
 */
function insertComputedSubtotals(
  rows: DataRow[],
  dimCols: string[],
  measureCols: string[],
  dimIndex: number,
  result: ProcessedRow[],
) {
  if (dimIndex >= dimCols.length) {
    result.push(...rows);
    return;
  }

  const col = dimCols[dimIndex];
  const groups = new Map<unknown, DataRow[]>();
  for (const row of rows) {
    const key = row[col];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  for (const [, groupRows] of groups) {
    insertComputedSubtotals(groupRows, dimCols, measureCols, dimIndex + 1, result);

    // Subtotal row only at non-leaf dim levels
    if (dimIndex < dimCols.length - 1 && groupRows.length > 1) {
      const subtotalRow: ProcessedRow = { _isSubtotal: true, _subtotalLevel: dimIndex };
      // Copy dim values at or above this level
      for (let i = 0; i <= dimIndex; i++) {
        subtotalRow[dimCols[i]] = groupRows[0][dimCols[i]];
      }
      // Aggregate measures (sum)
      for (const mc of measureCols) {
        const nums = groupRows.map((r) => r[mc]).filter((v) => typeof v === "number") as number[];
        subtotalRow[mc] = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) : null;
      }
      result.push(subtotalRow);
    }
  }
}

export function GroupedTable({ result, options, onClickDatum }: GroupedTableProps) {
  const configuredCols = options.groupedTableColumns ?? [];
  const subtotalMode = options.groupedTableSubtotals ?? "none";
  const showGrandTotal = options.groupedTableShowGrandTotal ?? false;
  const compact = options.groupedTableCompact ?? false;
  const striped = options.groupedTableStriped ?? true;

  // Fall back: if no columns configured, treat all as measures
  const effectiveCols: GroupedTableColumn[] = configuredCols.length > 0
    ? configuredCols
    : result.columns.map((c) => ({ column: c.name, role: "measure" as const }));

  const dimCols = effectiveCols.filter((c) => c.role === "dimension");
  const measureCols = effectiveCols.filter((c) => c.role === "measure");
  const dimColNames = dimCols.map((c) => c.column);
  const measureColNames = measureCols.map((c) => c.column);

  const formatMap = useMemo(() => {
    const m = new Map<string, ColumnFormat>();
    for (const c of effectiveCols) {
      if (c.format) m.set(c.column, c.format);
    }
    return m;
  }, [effectiveCols]);

  // Build processed row list (with optional subtotals)
  const processedRows = useMemo<ProcessedRow[]>(() => {
    if (subtotalMode === "sql-rollup") {
      // DuckDB ROLLUP produces nulls in dimension columns for rollup rows
      return result.rows.map((r) => {
        const nullDimCount = dimColNames.filter((d) => r[d] == null).length;
        const _isGrandTotal = nullDimCount === dimColNames.length && dimColNames.length > 0;
        const _isSubtotal = !_isGrandTotal && nullDimCount > 0;
        return { ...r, _isSubtotal, _isGrandTotal };
      });
    }

    if (subtotalMode === "computed") {
      const output: ProcessedRow[] = [];
      insertComputedSubtotals(result.rows, dimColNames, measureColNames, 0, output);
      if (showGrandTotal) {
        const grandRow: ProcessedRow = { _isGrandTotal: true };
        for (const d of dimColNames) grandRow[d] = null;
        for (const m of measureColNames) {
          const nums = result.rows.map((r) => r[m]).filter((v) => typeof v === "number") as number[];
          grandRow[m] = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) : null;
        }
        output.push(grandRow);
      }
      return output;
    }

    return result.rows;
  }, [result.rows, subtotalMode, dimColNames, measureColNames, showGrandTotal]);

  // Determine which dimension cells to suppress (show value once per group)
  const suppressedSet = useMemo(() => {
    const s = new Set<string>();
    for (let i = 1; i < processedRows.length; i++) {
      const row = processedRows[i];
      const prev = processedRows[i - 1];
      if (row._isSubtotal || row._isGrandTotal) continue;
      if (prev._isSubtotal || prev._isGrandTotal) continue;

      let allAboveSame = true;
      for (const dim of dimCols) {
        if (!allAboveSame) break;
        if (row[dim.column] === prev[dim.column]) {
          s.add(`${i}-${dim.column}`);
        } else {
          allAboveSame = false;
        }
      }
    }
    return s;
  }, [processedRows, dimCols]);

  const cellPy = compact ? "py-0.5" : "py-1.5";

  if (effectiveCols.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        No columns configured
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-muted/70">
              {effectiveCols.map((col) => {
                const fmt = formatMap.get(col.column);
                return (
                  <th
                    key={col.column}
                    className={`whitespace-nowrap px-3 ${cellPy} font-semibold tracking-wide`}
                    style={{
                      textAlign: fmt?.align ?? (col.role === "measure" ? "right" : "left"),
                      width: fmt?.width,
                      color: fmt?.textColor,
                      backgroundColor: fmt?.bgColor,
                    }}
                  >
                    {fmt?.label ?? col.column}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {processedRows.map((row, i) => {
              const isSubtotal = !!row._isSubtotal;
              const isGrandTotal = !!row._isGrandTotal;
              const isSpecial = isSubtotal || isGrandTotal;

              return (
                <tr
                  key={i}
                  className={[
                    "border-b border-border/30 transition-colors last:border-0",
                    striped && !isSpecial && i % 2 === 1 ? "bg-muted/20" : "",
                    isSubtotal ? "bg-muted/40 font-semibold" : "",
                    isGrandTotal ? "border-t-2 border-border bg-primary/10 font-bold" : "",
                    !isSpecial && onClickDatum ? "cursor-pointer hover:bg-muted/40" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={
                    !isSpecial && onClickDatum && dimCols.length > 0
                      ? () => onClickDatum({ column: dimCols[0].column, value: row[dimCols[0].column] })
                      : undefined
                  }
                >
                  {effectiveCols.map((col, colIdx) => {
                    const isDim = col.role === "dimension";
                    const isSuppressed = isDim && suppressedSet.has(`${i}-${col.column}`);
                    const value = row[col.column];
                    const fmt = formatMap.get(col.column);
                    const threshold =
                      typeof value === "number" ? evaluateThresholds(value, fmt?.thresholdRules) : undefined;

                    // Decide what to render
                    let cellContent: React.ReactNode;
                    if (isGrandTotal && isDim) {
                      cellContent =
                        colIdx === 0 ? (
                          <span className="italic text-muted-foreground">Grand Total</span>
                        ) : null;
                    } else if (isSubtotal && isDim && value == null) {
                      cellContent = <span className="italic text-muted-foreground">Subtotal</span>;
                    } else if (isSuppressed) {
                      cellContent = null;
                    } else {
                      cellContent = value == null ? (
                        <span className="text-muted-foreground/60">—</span>
                      ) : (
                        formatCell(value, fmt)
                      );
                    }

                    // Indentation: each dimension level adds 12px
                    const dimDepth = isDim ? dimCols.indexOf(col) : 0;

                    return (
                      <td
                        key={col.column}
                        className={`whitespace-nowrap px-3 ${cellPy}`}
                        style={{
                          textAlign: fmt?.align ?? (isDim ? "left" : "right"),
                          color: threshold?.color ?? fmt?.textColor,
                          backgroundColor: threshold?.bgColor ?? fmt?.bgColor,
                          width: fmt?.width,
                          paddingLeft: isDim ? `${dimDepth * 12 + 12}px` : undefined,
                        }}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border/30 px-3 py-1 text-[10px] text-muted-foreground">
        {result.rowCount.toLocaleString()} rows
        {subtotalMode !== "none" && " · subtotals enabled"}
      </div>
    </div>
  );
}
