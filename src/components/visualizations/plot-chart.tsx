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
    const marks: Plot.Markish[] = [];

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

    const channelOpts: Record<string, unknown> = {
      x,
      y: yField,
    };
    if (colorField) channelOpts.fill = colorField;
    if (colorField) channelOpts.stroke = colorField;

    switch (type) {
      case "bar":
        if (options.horizontal) {
          marks.push(
            Plot.barX(data, {
              y: x,
              x: yField,
              fill: colorField ?? options.colorScheme ?? "steelblue",
            }),
          );
        } else {
          marks.push(
            Plot.barY(data, {
              x,
              y: yField,
              fill: colorField ?? options.colorScheme ?? "steelblue",
            }),
          );
        }
        if (options.stacked && colorField) {
          // Observable Plot handles stacking automatically when fill is set
        }
        break;

      case "line":
        marks.push(
          Plot.lineY(data, {
            x,
            y: yField,
            stroke: colorField ?? options.colorScheme ?? "steelblue",
            curve: options.curve ?? "linear",
          }),
        );
        marks.push(
          Plot.ruleY([0]),
        );
        break;

      case "area":
        marks.push(
          Plot.areaY(data, {
            x,
            y: yField,
            fill: colorField ?? options.colorScheme ?? "steelblue",
            curve: options.curve ?? "linear",
            fillOpacity: 0.3,
          }),
        );
        marks.push(
          Plot.lineY(data, {
            x,
            y: yField,
            stroke: colorField ?? options.colorScheme ?? "steelblue",
            curve: options.curve ?? "linear",
          }),
        );
        break;

      case "scatter":
        marks.push(
          Plot.dot(data, {
            x,
            y: yField,
            fill: colorField ?? options.colorScheme ?? "steelblue",
            r: mapping.size ?? 3,
          }),
        );
        break;
    }

    const plotOptions: Plot.PlotOptions = {
      marks,
      width: el.clientWidth,
      height: el.clientHeight,
      marginLeft: 60,
      marginBottom: 40,
      style: {
        background: "transparent",
        overflow: "visible",
      },
    };

    if (options.showLegend === false) {
      plotOptions.color = { ...plotOptions.color, legend: false };
    }

    const svg = Plot.plot(plotOptions);
    el.replaceChildren(svg);

    return () => {
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
