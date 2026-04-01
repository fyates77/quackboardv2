import { useMemo } from "react";
import type { QueryResult } from "@/engine/types";
import type { ColumnFormat, VisualizationOptions } from "@/types/dashboard";
import { formatNumber } from "@/lib/format-number";

interface CrosstabProps {
  result: QueryResult;
  options: VisualizationOptions;
  onClickDatum?: (datum: { column: string; value: unknown }) => void;
}

/** Lerp two CSS hex colors (#rrggbb) by factor t in [0,1] */
function lerpHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const c = hex.replace("#", "").padEnd(6, "0");
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  };
  try {
    const [r1, g1, b1] = parse(a);
    const [r2, g2, b2] = parse(b);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const bv = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${bv})`;
  } catch {
    return "";
  }
}

/** Pick a legible text color (black or white) for a given background */
function contrastColor(bg: string): string {
  try {
    const [r, g, b] = bg
      .replace(/^rgb\(/, "")
      .replace(/\)$/, "")
      .split(",")
      .map(Number);
    // Relative luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    return lum > 140 ? "#111111" : "#ffffff";
  } catch {
    return "#111111";
  }
}

function fmtValue(value: number | null, fmt?: ColumnFormat): string {
  if (value == null) return "—";
  if (fmt?.numberFormat && fmt.numberFormat !== "auto") {
    return formatNumber(value, fmt.numberFormat, { decimals: fmt.decimals, currencyCode: fmt.currencyCode });
  }
  if (fmt?.decimals !== undefined) {
    return formatNumber(value, "auto", { decimals: fmt.decimals });
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

type AggFn = "sum" | "avg" | "count" | "min" | "max";

function aggregate(vals: number[], fn: AggFn): number {
  if (vals.length === 0) return 0;
  switch (fn) {
    case "sum":
      return vals.reduce((a, b) => a + b, 0);
    case "avg":
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    case "count":
      return vals.length;
    case "min":
      return Math.min(...vals);
    case "max":
      return Math.max(...vals);
  }
}

export function CrosstabTable({ result, options, onClickDatum }: CrosstabProps) {
  const rowDimCol = options.crosstabRowDim ?? result.columns[0]?.name ?? "";
  const colDimCol = options.crosstabColDim ?? result.columns[1]?.name ?? "";
  const measureCol = options.crosstabMeasure ?? result.columns[2]?.name ?? "";
  const aggFn: AggFn = options.crosstabAggregation ?? "sum";
  const colorScale = options.crosstabColorScale ?? false;
  const colorMin = options.crosstabColorMin ?? "#ffffff";
  const colorMax = options.crosstabColorMax ?? "#2563eb";
  const showRowTotals = options.crosstabShowRowTotals ?? false;
  const showColTotals = options.crosstabShowColTotals ?? false;
  const colFmts = options.crosstabColumnFormats ?? {};

  const { rowValues, colValues, pivot, rowTotals, colTotals, grandTotal, minVal, maxVal } = useMemo(() => {
    if (!rowDimCol || !colDimCol || !measureCol) {
      return { rowValues: [], colValues: [], pivot: new Map(), rowTotals: new Map(), colTotals: new Map(), grandTotal: 0, minVal: 0, maxVal: 0 };
    }

    // Collect unique row/col dimension values (preserve insertion order)
    const rowSet = new Map<unknown, true>();
    const colSet = new Map<unknown, true>();
    for (const row of result.rows) {
      rowSet.set(row[rowDimCol], true);
      colSet.set(row[colDimCol], true);
    }
    const rowValues = [...rowSet.keys()];
    const colValues = [...colSet.keys()];

    // Build rawMap: rowVal -> colVal -> number[]
    const rawMap = new Map<unknown, Map<unknown, number[]>>();
    for (const row of result.rows) {
      const rv = row[rowDimCol];
      const cv = row[colDimCol];
      const mv = row[measureCol];
      if (!rawMap.has(rv)) rawMap.set(rv, new Map());
      const inner = rawMap.get(rv)!;
      if (!inner.has(cv)) inner.set(cv, []);
      if (typeof mv === "number") inner.get(cv)!.push(mv);
    }

    // Aggregate pivot
    const pivot = new Map<unknown, Map<unknown, number | null>>();
    let minVal = Infinity;
    let maxVal = -Infinity;

    for (const rv of rowValues) {
      const inner = rawMap.get(rv);
      const rowMap = new Map<unknown, number | null>();
      pivot.set(rv, rowMap);
      for (const cv of colValues) {
        const vals = inner?.get(cv) ?? [];
        const agg = vals.length > 0 ? aggregate(vals, aggFn) : null;
        rowMap.set(cv, agg);
        if (agg !== null) {
          minVal = Math.min(minVal, agg);
          maxVal = Math.max(maxVal, agg);
        }
      }
    }

    // Row totals
    const rowTotals = new Map<unknown, number>();
    for (const [rv, rowMap] of pivot) {
      const vals = [...rowMap.values()].filter((v): v is number => v !== null);
      rowTotals.set(rv, aggregate(vals, aggFn === "count" ? "sum" : aggFn));
    }

    // Col totals
    const colTotals = new Map<unknown, number>();
    for (const cv of colValues) {
      const vals = rowValues.map((rv) => pivot.get(rv)?.get(cv) ?? null).filter((v): v is number => v !== null);
      colTotals.set(cv, aggregate(vals, aggFn === "count" ? "sum" : aggFn));
    }

    const grandTotal = [...rowTotals.values()].reduce((a, b) => a + b, 0);

    return {
      rowValues,
      colValues,
      pivot,
      rowTotals,
      colTotals,
      grandTotal,
      minVal: minVal === Infinity ? 0 : minVal,
      maxVal: maxVal === -Infinity ? 0 : maxVal,
    };
  }, [result.rows, rowDimCol, colDimCol, measureCol, aggFn]);

  function getCellBg(value: number | null): string | undefined {
    if (!colorScale || value === null || minVal === maxVal) return undefined;
    const t = (value - minVal) / (maxVal - minVal);
    return lerpHex(colorMin, colorMax, t);
  }

  if (!rowDimCol || !colDimCol || !measureCol) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Map row dimension, column dimension, and measure columns to render crosstab.
      </div>
    );
  }

  if (rowValues.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        No data
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="border-collapse text-xs">
          {/* ── Header row ── */}
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-muted/70">
              {/* Row-dim header */}
              <th className="whitespace-nowrap px-3 py-1.5 text-left font-semibold tracking-wide border-r border-border">
                {rowDimCol}
              </th>
              {colValues.map((cv) => {
                const fmt = colFmts[String(cv)];
                return (
                  <th
                    key={String(cv)}
                    className="whitespace-nowrap px-3 py-1.5 text-right font-semibold tracking-wide"
                    style={{
                      textAlign: fmt?.align ?? "right",
                      width: fmt?.width,
                      color: fmt?.textColor,
                      backgroundColor: fmt?.bgColor,
                    }}
                  >
                    {fmt?.label ?? String(cv ?? "—")}
                  </th>
                );
              })}
              {showRowTotals && (
                <th className="whitespace-nowrap border-l border-border px-3 py-1.5 text-right font-semibold text-muted-foreground">
                  Total
                </th>
              )}
            </tr>
          </thead>

          {/* ── Data rows ── */}
          <tbody>
            {rowValues.map((rv, ri) => {
              const rowMap = pivot.get(rv);
              const rowTotal = rowTotals.get(rv);
              return (
                <tr
                  key={String(rv)}
                  className={[
                    "border-b border-border/30 last:border-0 transition-colors",
                    ri % 2 === 1 ? "bg-muted/15" : "",
                    onClickDatum ? "cursor-pointer hover:bg-muted/40" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {/* Row dimension label */}
                  <td
                    className="whitespace-nowrap border-r border-border/50 px-3 py-1.5 font-medium"
                    onClick={
                      onClickDatum
                        ? () => onClickDatum({ column: rowDimCol, value: rv })
                        : undefined
                    }
                  >
                    {rv == null ? <span className="text-muted-foreground/60">—</span> : String(rv)}
                  </td>

                  {/* Measure cells */}
                  {colValues.map((cv) => {
                    const value = rowMap?.get(cv) ?? null;
                    const fmt = colFmts[String(cv)];
                    const bg = getCellBg(value);
                    const fg = bg ? contrastColor(bg) : fmt?.textColor;
                    return (
                      <td
                        key={String(cv)}
                        className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums"
                        style={{
                          backgroundColor: bg ?? fmt?.bgColor,
                          color: fg,
                          textAlign: fmt?.align ?? "right",
                        }}
                        onClick={
                          onClickDatum
                            ? () => onClickDatum({ column: colDimCol, value: cv })
                            : undefined
                        }
                      >
                        {fmtValue(value, fmt)}
                      </td>
                    );
                  })}

                  {/* Row total */}
                  {showRowTotals && (
                    <td className="whitespace-nowrap border-l border-border/50 px-3 py-1.5 text-right font-semibold tabular-nums text-muted-foreground">
                      {fmtValue(rowTotal ?? null, undefined)}
                    </td>
                  )}
                </tr>
              );
            })}

            {/* Column totals row */}
            {showColTotals && (
              <tr className="border-t-2 border-border bg-muted/40 font-bold">
                <td className="whitespace-nowrap border-r border-border/50 px-3 py-1.5 text-muted-foreground italic">
                  Total
                </td>
                {colValues.map((cv) => {
                  const value = colTotals.get(cv) ?? null;
                  const fmt = colFmts[String(cv)];
                  return (
                    <td
                      key={String(cv)}
                      className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums"
                      style={{ textAlign: fmt?.align ?? "right" }}
                    >
                      {fmtValue(value, fmt)}
                    </td>
                  );
                })}
                {showRowTotals && (
                  <td className="whitespace-nowrap border-l border-border/50 px-3 py-1.5 text-right font-bold tabular-nums">
                    {fmtValue(grandTotal, undefined)}
                  </td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border/30 px-3 py-1 text-[10px] text-muted-foreground">
        {rowValues.length} rows × {colValues.length} columns
        {colorScale && ` · color scale: ${minVal.toLocaleString()} → ${maxVal.toLocaleString()}`}
      </div>
    </div>
  );
}
