import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { QueryResult } from "@/engine/types";
import type { ColumnMapping, VisualizationOptions, PanelAnnotation } from "@/types/dashboard";

type PlotType =
  | "bar"
  | "line"
  | "area"
  | "scatter"
  | "histogram"
  | "box"
  | "heatmap"
  | "waffle"
  | "combo"
  | "tree"
  | "density"
  | "difference"
  | "flow";

const COMBO_LINE_COLORS = ["#ef4444", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981"];

interface ClickDatum {
  column: string;
  value: unknown;
}

interface PlotChartProps {
  type: PlotType;
  result: QueryResult;
  mapping: ColumnMapping;
  options: VisualizationOptions;
  annotations?: PanelAnnotation[];
  onClickDatum?: (datum: ClickDatum) => void;
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
    case "combo":
      return !!mapping.x && !!mapping.y;
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

export function PlotChart({ type, result, mapping, options, annotations, onClickDatum }: PlotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onClickRef = useRef(onClickDatum);
  onClickRef.current = onClickDatum;

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

    if (type === "combo" && y) {
      // Combo: don't flatten into multi-series — handle in switch case
      const yColumns = Array.isArray(y) ? y : [y];
      yField = yColumns[0];
    } else if (xyTypes.includes(type) && y) {
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
          const isGrouped = options.stacked === false && colorField === "_series";
          const barShared = {
            fill: colorField ?? (options.markColor ?? "steelblue"),
            ...(options.barStroke ? { stroke: options.barStroke, strokeWidth: 1 } : {}),
            ...(options.barFillOpacity != null ? { fillOpacity: options.barFillOpacity } : {}),
            ...(options.barCornerRadius != null ? { rx: options.barCornerRadius } : {}),
            ...(options.barInset != null ? { inset: options.barInset } : {}),
          };
          if (options.horizontal) {
            marks.push(
              Plot.barX(plotData, {
                y: isGrouped ? "_series" : x,
                x: yField,
                ...barShared,
                fy: isGrouped ? x : undefined,
                ...(options.barSort === "desc" ? { sort: { y: "-x" } } : {}),
                ...(options.barSort === "asc" ? { sort: { y: "x" } } : {}),
                ...(!isGrouped ? facet : {}),
              }),
            );
          } else {
            marks.push(
              Plot.barY(plotData, {
                x: isGrouped ? "_series" : x,
                y: yField,
                ...barShared,
                fx: isGrouped ? x : undefined,
                ...(options.barSort === "desc" ? { sort: { x: "-y" } } : {}),
                ...(options.barSort === "asc" ? { sort: { x: "y" } } : {}),
                ...(!isGrouped ? facet : {}),
              }),
            );
          }
          if (options.showBarLabels && x && yField) {
            if (options.horizontal) {
              marks.push(
                Plot.text(plotData, {
                  y: isGrouped ? "_series" : x,
                  x: yField,
                  text: (d: Record<string, unknown>) => {
                    const v = d[yField!];
                    return typeof v === "number" ? v.toLocaleString() : String(v ?? "");
                  },
                  dx: 4,
                  textAnchor: "start",
                  fontSize: 10,
                  fill: "currentColor",
                }),
              );
            } else {
              marks.push(
                Plot.text(plotData, {
                  x: isGrouped ? "_series" : x,
                  y: yField,
                  text: (d: Record<string, unknown>) => {
                    const v = d[yField!];
                    return typeof v === "number" ? v.toLocaleString() : String(v ?? "");
                  },
                  dy: -6,
                  textAnchor: "middle",
                  fontSize: 10,
                  fill: "currentColor",
                }),
              );
            }
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
                fill: colorField ?? (options.markColor ?? "steelblue"),
                ...facet,
              }),
            );
          } else {
            marks.push(
              Plot.waffleY(plotData, {
                x,
                y: yField,
                fill: colorField ?? (options.markColor ?? "steelblue"),
                ...facet,
              }),
            );
          }
          break;
        }

        case "line": {
          if (!x || !yField) break;
          const strokeDasharray =
            options.strokeStyle === "dashed" ? "6,4" :
            options.strokeStyle === "dotted" ? "2,3" :
            options.strokeStyle === "longdash" ? "12,4" :
            undefined;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let lineOpts: any = {
            x,
            y: yField,
            stroke: colorField ?? (options.markColor ?? "steelblue"),
            curve: options.curve ?? "linear",
            strokeWidth: options.strokeWidth ?? undefined,
            strokeOpacity: options.opacity ?? undefined,
            ...(strokeDasharray ? { strokeDasharray } : {}),
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
          if (options.showLinePoints) {
            marks.push(
              Plot.dot(plotData, {
                x,
                y: yField,
                fill: colorField ?? (options.markColor ?? "steelblue"),
                r: 3,
                ...facet,
              }),
            );
          }
          break;
        }

        case "area": {
          if (!x || !yField) break;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let areaOpts: any = {
            x,
            y: yField,
            fill: colorField ?? (options.markColor ?? "steelblue"),
            curve: options.curve ?? "linear",
            fillOpacity: options.opacity ?? 0.3,
            ...facet,
          };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let areaLineOpts: any = {
            x,
            y: yField,
            stroke: colorField ?? (options.markColor ?? "steelblue"),
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
          const dotColor = options.markColor ?? "steelblue";
          const dotMode = options.dotMode ?? "fill";
          const dotFill = dotMode === "stroke" ? "none" : (colorField ?? dotColor);
          const dotStroke = dotMode === "fill" ? (colorField ?? dotColor) : (colorField ?? dotColor);
          const dotFillOpacity = dotMode === "both" ? 0.2 : undefined;
          const dotSymbol = options.dotSymbol ?? (colorField === "_series" ? "_series" : undefined);
          marks.push(
            Plot.dot(plotData, {
              x,
              y: yField,
              fill: dotFill,
              stroke: dotMode !== "fill" ? dotStroke : undefined,
              fillOpacity: dotFillOpacity,
              r: mapping.size ?? 3,
              ...(dotSymbol ? { symbol: dotSymbol } : {}),
              ...facet,
            }),
          );
          if (mapping.label) {
            marks.push(
              Plot.text(plotData, {
                x,
                y: yField,
                text: mapping.label,
                dy: -8,
                fontSize: 10,
                fill: "currentColor",
              }),
            );
          }
          break;
        }

        case "histogram": {
          if (!x) break;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const binOpts: any = { x };
          if (colorField) binOpts.fill = colorField;
          else binOpts.fill = options.markColor ?? "steelblue";
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
                fill: colorField ?? (options.markColor ?? "steelblue"),
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

        case "combo": {
          if (!x) break;
          const yColumns = Array.isArray(mapping.y) ? mapping.y : mapping.y ? [mapping.y] : [];
          if (yColumns.length === 0) break;

          // First Y column: bars
          marks.push(
            Plot.barY(data, {
              x,
              y: yColumns[0],
              fill: options.markColor ?? "steelblue",
              fillOpacity: options.opacity ?? 0.7,
              ...facet,
            }),
          );

          // Remaining Y columns: lines with dots
          for (let i = 1; i < yColumns.length; i++) {
            const lineColor = COMBO_LINE_COLORS[(i - 1) % COMBO_LINE_COLORS.length];
            marks.push(
              Plot.lineY(data, {
                x,
                y: yColumns[i],
                stroke: lineColor,
                strokeWidth: options.strokeWidth ?? 2,
                curve: options.curve ?? "linear",
                ...facet,
              }),
            );
            marks.push(
              Plot.dot(data, {
                x,
                y: yColumns[i],
                fill: lineColor,
                r: 3,
                ...facet,
              }),
            );
          }
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

      // --- Annotations ---
      if (annotations && annotations.length > 0) {
        for (const ann of annotations) {
          if (ann.x !== undefined && ann.y !== undefined) {
            // Point annotation: dot + text
            marks.push(
              Plot.dot([{ x: ann.x, y: ann.y }], {
                x: "x",
                y: "y",
                fill: "#f59e0b",
                r: 5,
                stroke: "white",
                strokeWidth: 1.5,
              }),
            );
            marks.push(
              Plot.text([{ text: ann.text, x: ann.x, y: ann.y }], {
                x: "x",
                y: "y",
                text: "text",
                dy: -12,
                fill: "#f59e0b",
                fontSize: 10,
                fontWeight: "bold",
              }),
            );
          } else if (ann.x !== undefined) {
            // Vertical line annotation
            marks.push(
              Plot.ruleX([ann.x], {
                stroke: "#f59e0b",
                strokeWidth: 1.5,
                strokeDasharray: "4,3",
              }),
            );
            marks.push(
              Plot.text([{ text: ann.text, value: ann.x }], {
                x: "value",
                text: "text",
                frameAnchor: "top",
                dy: 8,
                fill: "#f59e0b",
                fontSize: 10,
                fontWeight: "bold",
              }),
            );
          }
        }
      }

      // --- Axis borders ---
      if (options.chartFrame) {
        marks.push(Plot.frame({ strokeOpacity: 0.3 }));
      }

      // --- Custom grid marks (independent of axis ticks) ---
      const xHasCustomGrid =
        options.xGrid &&
        (options.xGridColor || options.xGridWidth != null || options.xGridOpacity != null || options.xGridTicks != null);
      const yHasCustomGrid =
        options.yGrid &&
        (options.yGridColor || options.yGridWidth != null || options.yGridOpacity != null || options.yGridTicks != null);
      if (xHasCustomGrid) {
        marks.push(
          Plot.gridX({
            ...(options.xGridTicks != null ? { ticks: options.xGridTicks } : {}),
            stroke: options.xGridColor ?? "currentColor",
            strokeWidth: options.xGridWidth ?? 1,
            strokeOpacity: options.xGridOpacity ?? 0.1,
          }),
        );
      }
      if (yHasCustomGrid) {
        marks.push(
          Plot.gridY({
            ...(options.yGridTicks != null ? { ticks: options.yGridTicks } : {}),
            stroke: options.yGridColor ?? "currentColor",
            strokeWidth: options.yGridWidth ?? 1,
            strokeOpacity: options.yGridOpacity ?? 0.1,
          }),
        );
      }

      // --- Preserve SQL ORDER BY: compute categorical domain in data first-appearance order ---
      // Observable Plot collects domain values in first-appearance order by default, but
      // explicitly setting `domain` guarantees it — preventing any internal re-sorting.
      // Only applies when no explicit value-sort is active (barSort overrides data order).
      const isGroupedBar = type === "bar" && options.stacked === false && colorField === "_series";
      const catAxis = x && !options.barSort
        ? ([...new Set(plotData.map((d: Record<string, unknown>) => d[x!]))] as unknown[])
        : undefined;
      // For vertical bars the categorical dimension is x; for horizontal it's y.
      const xCatDomain: string[] | undefined =
        catAxis && !options.horizontal && !isGroupedBar && typeof catAxis[0] === "string"
          ? catAxis as string[]
          : undefined;
      const yCatDomain: string[] | undefined =
        catAxis && options.horizontal && !isGroupedBar && typeof catAxis[0] === "string"
          ? catAxis as string[]
          : undefined;

      // --- Data-type preset → tickFormat (xDataType/yDataType override if no explicit format) ---
      const DATA_TYPE_FORMAT: Record<string, string> = {
        number: ",.2f",
        integer: ",.0f",
        percent: ".0%",
        currency: "$,.0f",
        compact: "~s",
        "date-month": "%b %Y",
        "date-year": "%Y",
      };
      const xEffectiveFormat = options.xTickFormat
        || (options.xDataType && options.xDataType !== "auto" ? DATA_TYPE_FORMAT[options.xDataType] : undefined);
      const yEffectiveFormat = options.yTickFormat
        || (options.yDataType && options.yDataType !== "auto" ? DATA_TYPE_FORMAT[options.yDataType] : undefined);

      // --- Plot options ---
      const plotOptions: Plot.PlotOptions = {
        marks,
        width: el.clientWidth || 400,
        height: el.clientHeight || 300,
        marginLeft: options.marginLeft ?? 60,
        marginBottom: options.marginBottom ?? 40,
        marginTop: options.marginTop ?? 20,
        marginRight: options.marginRight ?? 20,
        ...(options.chartTitle ? { title: options.chartTitle } : {}),
        ...(options.chartSubtitle ? { subtitle: options.chartSubtitle } : {}),
        style: {
          background: "transparent",
          overflow: "visible",
          ...(options.axisFontSize ? { fontSize: `${options.axisFontSize}px` } : {}),
        },
        x: {
          ...(xCatDomain ? { domain: xCatDomain } : {}),
          label: options.xLabel ?? null,
          // Use custom grid mark if grid style is customised, otherwise fall back to scale.grid
          grid: xHasCustomGrid ? false : (options.xGrid ?? false),
          ...(options.xScaleType ? { type: options.xScaleType } : {}),
          ...(options.xReverse ? { reverse: true } : {}),
          ...(xEffectiveFormat ? { tickFormat: xEffectiveFormat } : {}),
          ...(options.xAxisLine ? { line: true } : {}),
        },
        y: {
          ...(yCatDomain ? { domain: yCatDomain } : {}),
          label: options.yLabel ?? null,
          grid: yHasCustomGrid ? false : (options.yGrid ?? false),
          ...(options.yScaleType ? { type: options.yScaleType } : {}),
          ...(options.yZero ? { zero: true } : {}),
          ...(options.yNice !== false ? { nice: true } : {}),
          ...(options.yReverse ? { reverse: true } : {}),
          ...(yEffectiveFormat ? { tickFormat: yEffectiveFormat } : {}),
          ...(options.yAxisLine ? { line: true } : {}),
        },
      };

      // Faceting
      if (mapping.fx) {
        plotOptions.fx = { label: null };
      }
      if (mapping.fy) {
        plotOptions.fy = { label: null };
      }

      // Series color overrides (per-series custom colors, highest priority)
      if (colorField && options.seriesColors && Object.keys(options.seriesColors).length > 0) {
        const domain = [...new Set(plotData.map((d: Record<string, unknown>) => String(d[colorField])))] as string[];
        const range = domain.map((s) => options.seriesColors![s] ?? "steelblue");
        plotOptions.color = {
          domain,
          range,
          legend: options.showLegend !== false,
          ...(options.legendTitle ? { label: options.legendTitle } : {}),
        };
      }
      // Color scheme
      else if (type === "heatmap") {
        // Sequential scheme for numeric fill
        plotOptions.color = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          scheme: (options.colorScheme ?? "ylgnbu") as any,
          type: "sequential",
          legend: options.showLegend !== false,
          ...(options.colorDomainMin != null || options.colorDomainMax != null
            ? { domain: [options.colorDomainMin ?? 0, options.colorDomainMax ?? 1] }
            : {}),
          ...(options.legendTickFormat ? { tickFormat: options.legendTickFormat } : {}),
          ...(options.legendTitle ? { label: options.legendTitle } : {}),
        };
      } else if (options.colorScheme && colorField) {
        plotOptions.color = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          scheme: options.colorScheme as any,
          legend: options.showLegend !== false,
          ...(options.legendTitle ? { label: options.legendTitle } : {}),
        };
      } else if (options.showLegend === false) {
        plotOptions.color = { legend: false };
      } else if (options.legendTitle && colorField) {
        // showLegend is not false here (that branch is above), so legend = true
        plotOptions.color = { legend: true, label: options.legendTitle };
      }

      const svg = Plot.plot(plotOptions);
      el.replaceChildren(svg);

      // Add click handler for cross-filtering / drilldown
      if (onClickRef.current) {
        svg.style.cursor = "pointer";
        svg.addEventListener("click", (event: Event) => {
          const cb = onClickRef.current;
          if (!cb) return;
          // Walk up from target to find a mark element with __data__
          let target = event.target as Element | null;
          while (target && target !== svg) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const d = (target as any).__data__;
            if (d != null && typeof d === "object") {
              // Determine the best column to use as the click value
              const clickColumn = x ?? mapping.category ?? mapping.path;
              if (clickColumn && d[clickColumn] !== undefined) {
                cb({ column: clickColumn, value: d[clickColumn] });
                return;
              }
            }
            target = target.parentElement;
          }
        });
      }
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
