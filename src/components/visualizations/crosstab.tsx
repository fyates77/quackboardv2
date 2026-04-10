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
    return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
  } catch {
    return "";
  }
}

function contrastColor(bg: string): string {
  try {
    const [r, g, b] = bg.replace(/^rgb\(/, "").replace(/\)$/, "").split(",").map(Number);
    return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? "#111111" : "#ffffff";
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

/**
 * Renders a DuckDB PIVOT result.
 * Expected shape: column[0] = row-dim header, columns[1..n] = pivoted measure values.
 * All aggregation is done by DuckDB — this component only renders.
 */
export function CrosstabTable({ result, options, onClickDatum }: CrosstabProps) {
  if (result.columns.length < 2) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground p-4 text-center">
        Configure the source query, row dimension, column dimension, and measure to generate a pivot table.
      </div>
    );
  }

  const rowDimCol = result.columns[0].name;
  const dataCols = result.columns.slice(1);

  const colorScale = options.crosstabColorScale ?? false;
  const colorMin = options.crosstabColorMin ?? "#ffffff";
  const colorMax = options.crosstabColorMax ?? "#2563eb";
  const showRowTotals = options.crosstabShowRowTotals ?? false;
  const showColTotals = options.crosstabShowColTotals ?? false;
  const colFmts = options.crosstabColumnFormats ?? {};

  const { minVal, maxVal, colTotals, grandTotal } = useMemo(() => {
    let minVal = Infinity;
    let maxVal = -Infinity;
    const colTotals: Record<string, number> = {};

    for (const col of dataCols) colTotals[col.name] = 0;

    for (const row of result.rows) {
      for (const col of dataCols) {
        const v = row[col.name];
        if (typeof v === "number") {
          if (v < minVal) minVal = v;
          if (v > maxVal) maxVal = v;
          colTotals[col.name] += v;
        }
      }
    }

    return {
      minVal: minVal === Infinity ? 0 : minVal,
      maxVal: maxVal === -Infinity ? 0 : maxVal,
      colTotals,
      grandTotal: Object.values(colTotals).reduce((a, b) => a + b, 0),
    };
  }, [result.rows, dataCols]);

  function getCellBg(value: number | null): string | undefined {
    if (!colorScale || value === null || minVal === maxVal) return undefined;
    return lerpHex(colorMin, colorMax, (value - minVal) / (maxVal - minVal));
  }

  if (result.rows.length === 0) {
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
          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-muted/70">
              <th className="whitespace-nowrap px-3 py-1.5 text-left font-semibold tracking-wide border-r border-border">
                {rowDimCol}
              </th>
              {dataCols.map((col) => {
                const fmt = colFmts[col.name];
                return (
                  <th
                    key={col.name}
                    className="whitespace-nowrap px-3 py-1.5 text-right font-semibold tracking-wide"
                    style={{
                      textAlign: fmt?.align ?? "right",
                      width: fmt?.width,
                      color: fmt?.textColor,
                      backgroundColor: fmt?.bgColor,
                    }}
                  >
                    {fmt?.label ?? col.name}
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

          {/* Data rows */}
          <tbody>
            {result.rows.map((row, ri) => {
              const rowVal = row[rowDimCol];
              const rowTotal = showRowTotals
                ? dataCols.reduce((sum, col) => {
                    const v = row[col.name];
                    return sum + (typeof v === "number" ? v : 0);
                  }, 0)
                : 0;

              return (
                <tr
                  key={ri}
                  className={[
                    "border-b border-border/30 last:border-0 transition-colors",
                    ri % 2 === 1 ? "bg-muted/15" : "",
                    onClickDatum ? "cursor-pointer hover:bg-muted/40" : "",
                  ].filter(Boolean).join(" ")}
                >
                  <td
                    className="whitespace-nowrap border-r border-border/50 px-3 py-1.5 font-medium"
                    onClick={onClickDatum ? () => onClickDatum({ column: rowDimCol, value: rowVal }) : undefined}
                  >
                    {rowVal == null ? <span className="text-muted-foreground/60">—</span> : String(rowVal)}
                  </td>

                  {dataCols.map((col) => {
                    const value = row[col.name];
                    const num = typeof value === "number" ? value : null;
                    const fmt = colFmts[col.name];
                    const bg = getCellBg(num);
                    const fg = bg ? contrastColor(bg) : fmt?.textColor;
                    return (
                      <td
                        key={col.name}
                        className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums"
                        style={{ backgroundColor: bg ?? fmt?.bgColor, color: fg, textAlign: fmt?.align ?? "right" }}
                        onClick={onClickDatum ? () => onClickDatum({ column: col.name, value }) : undefined}
                      >
                        {fmtValue(num, fmt)}
                      </td>
                    );
                  })}

                  {showRowTotals && (
                    <td className="whitespace-nowrap border-l border-border/50 px-3 py-1.5 text-right font-semibold tabular-nums text-muted-foreground">
                      {fmtValue(rowTotal, undefined)}
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
                {dataCols.map((col) => {
                  const fmt = colFmts[col.name];
                  return (
                    <td
                      key={col.name}
                      className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums"
                      style={{ textAlign: fmt?.align ?? "right" }}
                    >
                      {fmtValue(colTotals[col.name] ?? null, fmt)}
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
        {result.rows.length} rows × {dataCols.length} columns
        {colorScale && ` · color scale: ${minVal.toLocaleString()} → ${maxVal.toLocaleString()}`}
      </div>
    </div>
  );
}
