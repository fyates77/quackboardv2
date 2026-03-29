import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { QueryResult } from "@/engine/types";
import type { ColumnMapping, VisualizationOptions } from "@/types/dashboard";

interface PlotChartProps {
  type: "bar" | "line" | "area" | "scatter";
  result: QueryResult;
  mapping: ColumnMapping;
  options: VisualizationOptions;
}

export function PlotChart({ type, result, mapping, options }: PlotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || result.rows.length === 0) return;

    const { x, y, color } = mapping;
    if (!x || !y) return;

    const yColumns = Array.isArray(y) ? y : [y];

    // If multiple y columns, reshape data into long format
    let data: Record<string, unknown>[];
    let yField: string;
    let colorField: string | undefined;

    if (yColumns.length > 1) {
      data = [];
      for (const row of result.rows) {
        for (const col of yColumns) {
          data.push({ ...row, _series: col, _value: row[col] });
        }
      }
      yField = "_value";
      colorField = "_series";
    } else {
      data = result.rows as Record<string, unknown>[];
      yField = yColumns[0];
      colorField = color;
    }

    const render = () => {
      const marks: Plot.Markish[] = [];

      // --- Build marks per chart type ---
      switch (type) {
        case "bar":
          if (options.horizontal) {
            marks.push(
              Plot.barX(data, {
                y: x,
                x: yField,
                fill: colorField ?? "steelblue",
              }),
            );
          } else {
            marks.push(
              Plot.barY(data, {
                x,
                y: yField,
                fill: colorField ?? "steelblue",
              }),
            );
          }
          break;

        case "line":
          marks.push(
            Plot.lineY(data, {
              x,
              y: yField,
              stroke: colorField ?? "steelblue",
              curve: options.curve ?? "linear",
            }),
          );
          marks.push(Plot.ruleY([0]));
          break;

        case "area":
          marks.push(
            Plot.areaY(data, {
              x,
              y: yField,
              fill: colorField ?? "steelblue",
              curve: options.curve ?? "linear",
              fillOpacity: 0.3,
            }),
          );
          marks.push(
            Plot.lineY(data, {
              x,
              y: yField,
              stroke: colorField ?? "steelblue",
              curve: options.curve ?? "linear",
            }),
          );
          break;

        case "scatter":
          marks.push(
            Plot.dot(data, {
              x,
              y: yField,
              fill: colorField ?? "steelblue",
              r: mapping.size ?? 3,
            }),
          );
          break;
      }

      // --- Tooltips (default on) ---
      if (options.showTooltip !== false) {
        const tipChannels: Record<string, string> = { x, y: yField };
        if (colorField) tipChannels.fill = colorField;

        if (type === "bar") {
          if (options.horizontal) {
            marks.push(
              Plot.tip(data, Plot.pointerY({ y: x, x: yField, fill: colorField ?? undefined })),
            );
          } else {
            marks.push(
              Plot.tip(data, Plot.pointerX({ x, y: yField, fill: colorField ?? undefined })),
            );
          }
        } else {
          marks.push(
            Plot.tip(data, Plot.pointer({ x, y: yField, stroke: colorField ?? undefined })),
          );
        }
      }

      // --- Crosshair for line/area (opt-in) ---
      if (options.crosshair && (type === "line" || type === "area")) {
        marks.push(Plot.crosshair(data, { x, y: yField }));
      }

      // --- Plot options ---
      const plotOptions: Plot.PlotOptions = {
        marks,
        width: el.clientWidth || 400,
        height: el.clientHeight || 300,
        marginLeft: 60,
        marginBottom: 40,
        marginTop: 20,
        marginRight: 20,
        style: {
          background: "transparent",
          overflow: "visible",
        },
        x: {
          label: options.xLabel ?? null,
          grid: options.xGrid ?? false,
        },
        y: {
          label: options.yLabel ?? null,
          grid: options.yGrid ?? false,
        },
      };

      // Color scheme
      if (options.colorScheme && colorField) {
        plotOptions.color = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          scheme: options.colorScheme as any,
          legend: options.showLegend !== false,
        };
      } else if (options.showLegend === false) {
        plotOptions.color = { legend: false };
      }

      const svg = Plot.plot(plotOptions);
      el.replaceChildren(svg);
    };

    render();

    // Responsive resize
    const ro = new ResizeObserver(() => {
      render();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      el.replaceChildren();
    };
  }, [type, result, mapping, options]);

  if (!mapping.x || !mapping.y) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Configure x and y columns to render chart
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
