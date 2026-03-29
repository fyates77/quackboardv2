import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { QueryResult } from "@/engine/types";
import type { ColumnMapping, VisualizationOptions } from "@/types/dashboard";

type PlotType =
  | "bar"
  | "line"
  | "area"
  | "scatter"
  | "histogram"
  | "box"
  | "heatmap"
  | "waffle"
  | "tree"
  | "density"
  | "difference"
  | "flow";

interface PlotChartProps {
  type: PlotType;
  result: QueryResult;
  mapping: ColumnMapping;
  options: VisualizationOptions;
}

/** Check whether the mapping has enough columns for this chart type. */
function hasRequiredMapping(type: PlotType, mapping: ColumnMapping): boolean {
  switch (type) {
    case "histogram":
      return !!mapping.x;
    case "heatmap":
      return !!mapping.x && !!mapping.y && !!mapping.value;
    case "tree":
      return !!mapping.path;
    case "density":
      return !!mapping.x && !!mapping.y;
    case "difference":
      return !!mapping.x && !!mapping.y1 && !!mapping.y2;
    case "flow":
      return !!mapping.x1 && !!mapping.y1Flow && !!mapping.x2 && !!mapping.y2Flow;
    default:
      return !!mapping.x && !!mapping.y;
  }
}

function emptyHint(type: PlotType): string {
  switch (type) {
    case "histogram":
      return "Configure x column to render histogram";
    case "heatmap":
      return "Configure x, y, and value columns to render heatmap";
    case "tree":
      return "Configure path column to render tree";
    case "difference":
      return "Configure x, y1, and y2 columns to render difference chart";
    case "flow":
      return "Configure x1, y1, x2, y2 columns to render flow diagram";
    default:
      return "Configure x and y columns to render chart";
  }
}

export function PlotChart({ type, result, mapping, options }: PlotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || result.rows.length === 0) return;
    if (!hasRequiredMapping(type, mapping)) return;

    const { x, y, color } = mapping;
    const data = result.rows as Record<string, unknown>[];

    // --- Prepare multi-series data for x/y chart types ---
    const xyTypes: PlotType[] = ["bar", "line", "area", "scatter", "waffle"];
    let plotData = data;
    let yField: string | undefined;
    let colorField = color;

    if (xyTypes.includes(type) && y) {
      const yColumns = Array.isArray(y) ? y : [y];
      if (yColumns.length > 1) {
        plotData = [];
        for (const row of data) {
          for (const col of yColumns) {
            plotData.push({ ...row, _series: col, _value: row[col] });
          }
        }
        yField = "_value";
        colorField = "_series";
      } else {
        yField = yColumns[0];
      }
    } else if (type === "box" && y) {
      yField = Array.isArray(y) ? y[0] : y;
    }

    const render = () => {
      const marks: Plot.Markish[] = [];

      // Facet channels — spread into marks that support it
      const facet: Record<string, string> = {};
      if (mapping.fx) facet.fx = mapping.fx;
      if (mapping.fy) facet.fy = mapping.fy;

      switch (type) {
        case "bar": {
          if (!x || !yField) break;
          if (options.horizontal) {
            marks.push(
              Plot.barX(plotData, {
                y: x,
                x: yField,
                fill: colorField ?? "steelblue",
                ...facet,
              }),
            );
          } else {
            marks.push(
              Plot.barY(plotData, {
                x,
                y: yField,
                fill: colorField ?? "steelblue",
                ...facet,
              }),
            );
          }
          break;
        }

        case "waffle": {
          if (!x || !yField) break;
          if (options.horizontal) {
            marks.push(
              Plot.waffleX(plotData, {
                y: x,
                x: yField,
                fill: colorField ?? "steelblue",
                ...facet,
              }),
            );
          } else {
            marks.push(
              Plot.waffleY(plotData, {
                x,
                y: yField,
                fill: colorField ?? "steelblue",
                ...facet,
              }),
            );
          }
          break;
        }

        case "line": {
          if (!x || !yField) break;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let lineOpts: any = {
            x,
            y: yField,
            stroke: colorField ?? "steelblue",
            curve: options.curve ?? "linear",
            strokeWidth: options.strokeWidth ?? undefined,
            strokeOpacity: options.opacity ?? undefined,
            ...facet,
          };
          if (options.windowSize && options.windowSize > 1) {
            lineOpts = Plot.windowY(
              { k: options.windowSize, reduce: options.windowReduce ?? "mean" },
              lineOpts,
            );
          }
          if (options.normalize) {
            lineOpts = Plot.normalizeY(options.normalize, lineOpts);
          }
          marks.push(Plot.lineY(plotData, lineOpts));
          marks.push(Plot.ruleY([0]));
          break;
        }

        case "area": {
          if (!x || !yField) break;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let areaOpts: any = {
            x,
            y: yField,
            fill: colorField ?? "steelblue",
            curve: options.curve ?? "linear",
            fillOpacity: options.opacity ?? 0.3,
            ...facet,
          };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let areaLineOpts: any = {
            x,
            y: yField,
            stroke: colorField ?? "steelblue",
            curve: options.curve ?? "linear",
            strokeWidth: options.strokeWidth ?? undefined,
            ...facet,
          };
          if (options.windowSize && options.windowSize > 1) {
            areaOpts = Plot.windowY(
              { k: options.windowSize, reduce: options.windowReduce ?? "mean" },
              areaOpts,
            );
            areaLineOpts = Plot.windowY(
              { k: options.windowSize, reduce: options.windowReduce ?? "mean" },
              areaLineOpts,
            );
          }
          if (options.normalize) {
            areaOpts = Plot.normalizeY(options.normalize, areaOpts);
            areaLineOpts = Plot.normalizeY(options.normalize, areaLineOpts);
          }
          marks.push(Plot.areaY(plotData, areaOpts));
          marks.push(Plot.lineY(plotData, areaLineOpts));
          break;
        }

        case "scatter": {
          if (!x || !yField) break;
          marks.push(
            Plot.dot(plotData, {
              x,
              y: yField,
              fill: colorField ?? "steelblue",
              r: mapping.size ?? 3,
              ...facet,
            }),
          );
          break;
        }

        case "histogram": {
          if (!x) break;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const binOpts: any = { x };
          if (colorField) binOpts.fill = colorField;
          else binOpts.fill = "steelblue";
          if (options.thresholds) binOpts.thresholds = options.thresholds;
          marks.push(Plot.rectY(data, Plot.binX({ y: "count" }, binOpts)));
          marks.push(Plot.ruleY([0]));
          break;
        }

        case "box": {
          if (!x || !yField) break;
          marks.push(
            Plot.boxY(data, { x, y: yField }),
          );
          break;
        }

        case "heatmap": {
          if (!x || !y) break;
          const yStr = Array.isArray(y) ? y[0] : y;
          const fillCol = mapping.value;
          if (!fillCol) break;
          marks.push(
            Plot.cell(data, {
              x,
              y: yStr,
              fill: fillCol,
              tip: options.showTooltip !== false,
            }),
          );
          break;
        }

        case "tree": {
          const pathCol = mapping.path;
          if (!pathCol) break;
          const delimiter = options.treeDelimiter ?? "/";
          const treeFn = options.treeLayout === "cluster" ? Plot.cluster : Plot.tree;
          marks.push(
            treeFn(data, {
              path: pathCol,
              delimiter,
              textLayout: "mirrored",
              tip: options.showTooltip !== false,
            }),
          );
          break;
        }

        case "density": {
          if (!x || !y) break;
          const yDensity = Array.isArray(y) ? y[0] : y;
          marks.push(
            Plot.density(data, {
              x,
              y: yDensity,
              bandwidth: options.densityBandwidth ?? 20,
              thresholds: options.densityThresholds ?? 20,
              fill: colorField ?? "density",
              fillOpacity: options.opacity ?? 0.5,
              stroke: "currentColor",
              strokeWidth: 0.5,
            }),
          );
          if (options.densityShowPoints !== false) {
            marks.push(
              Plot.dot(data, {
                x,
                y: yDensity,
                fill: colorField ?? "steelblue",
                r: 2,
                fillOpacity: 0.6,
              }),
            );
          }
          break;
        }

        case "difference": {
          const { y1, y2 } = mapping;
          if (!x || !y1 || !y2) break;
          marks.push(
            Plot.differenceY(data, {
              x,
              y1,
              y2,
              positiveFill: options.positiveFill ?? "#4ade80",
              negativeFill: options.negativeFill ?? "#60a5fa",
              tip: options.showTooltip !== false,
            }),
          );
          marks.push(Plot.ruleY([0]));
          break;
        }

        case "flow": {
          const { x1, y1Flow, x2, y2Flow } = mapping;
          if (!x1 || !y1Flow || !x2 || !y2Flow) break;
          marks.push(
            Plot.arrow(data, {
              x1,
              y1: y1Flow,
              x2,
              y2: y2Flow,
              bend: options.flowBend ?? 0,
              stroke: colorField ?? "currentColor",
              strokeWidth: options.strokeWidth ?? 1.5,
              strokeOpacity: options.opacity ?? 0.7,
            }),
          );
          // Node dots at source and target
          marks.push(
            Plot.dot(data, {
              x: x1,
              y: y1Flow,
              fill: "currentColor",
              r: 3,
            }),
          );
          marks.push(
            Plot.dot(data, {
              x: x2,
              y: y2Flow,
              fill: "currentColor",
              r: 3,
            }),
          );
          break;
        }
      }

      // --- Tooltips (default on) ---
      // Heatmap/tree/density/difference use inline tip above. Box has built-in tips.
      const inlineTipTypes: PlotType[] = ["heatmap", "box", "tree", "density", "difference", "flow"];
      if (
        options.showTooltip !== false &&
        !inlineTipTypes.includes(type)
      ) {
        if (type === "histogram") {
          // Tip on binned data — use pointer on the rect
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tipBinOpts: any = { x: x! };
          if (colorField) tipBinOpts.fill = colorField;
          marks.push(
            Plot.tip(data, Plot.pointer(Plot.binX({ y: "count" }, tipBinOpts))),
          );
        } else if (type === "bar" || type === "waffle") {
          if (options.horizontal) {
            marks.push(
              Plot.tip(plotData, Plot.pointerY({ y: x!, x: yField!, fill: colorField ?? undefined })),
            );
          } else {
            marks.push(
              Plot.tip(plotData, Plot.pointerX({ x: x!, y: yField!, fill: colorField ?? undefined })),
            );
          }
        } else if (x && yField) {
          marks.push(
            Plot.tip(plotData, Plot.pointer({ x, y: yField, stroke: colorField ?? undefined })),
          );
        }
      }

      // --- Crosshair for line/area (opt-in) ---
      if (options.crosshair && (type === "line" || type === "area") && x && yField) {
        marks.push(Plot.crosshair(plotData, { x, y: yField }));
      }

      // --- Trend line (scatter/line) ---
      if (options.showTrendLine && x && yField && (type === "scatter" || type === "line")) {
        marks.push(
          Plot.linearRegressionY(plotData, {
            x,
            y: yField,
            stroke: "currentColor",
            strokeWidth: 1.5,
            strokeDasharray: "4,4",
          }),
        );
      }

      // --- Reference lines ---
      if (options.referenceLines) {
        for (const ref of options.referenceLines) {
          if (ref.axis === "y") {
            marks.push(Plot.ruleY([ref.value], { stroke: "red", strokeDasharray: "4,4" }));
            if (ref.label) {
              marks.push(
                Plot.text([{ text: ref.label, value: ref.value }], {
                  y: "value",
                  text: "text",
                  frameAnchor: "right",
                  dx: -4,
                  fill: "red",
                  fontSize: 10,
                }),
              );
            }
          } else {
            marks.push(Plot.ruleX([ref.value], { stroke: "red", strokeDasharray: "4,4" }));
          }
        }
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
          ...(options.xScaleType ? { type: options.xScaleType } : {}),
          ...(options.xReverse ? { reverse: true } : {}),
        },
        y: {
          label: options.yLabel ?? null,
          grid: options.yGrid ?? false,
          ...(options.yScaleType ? { type: options.yScaleType } : {}),
          ...(options.yZero ? { zero: true } : {}),
          ...(options.yNice !== false ? { nice: true } : {}),
          ...(options.yReverse ? { reverse: true } : {}),
        },
      };

      // Faceting
      if (mapping.fx) {
        plotOptions.fx = { label: null };
      }
      if (mapping.fy) {
        plotOptions.fy = { label: null };
      }

      // Color scheme
      if (type === "heatmap") {
        // Sequential scheme for numeric fill
        plotOptions.color = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          scheme: (options.colorScheme ?? "ylgnbu") as any,
          type: "sequential",
          legend: options.showLegend !== false,
        };
      } else if (options.colorScheme && colorField) {
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

  if (!hasRequiredMapping(type, mapping)) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        {emptyHint(type)}
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
