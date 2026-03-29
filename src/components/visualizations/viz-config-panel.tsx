import {
  BarChart3,
  LineChart,
  AreaChart,
  ScatterChart,
  PieChart,
  Table2,
  Hash,
  BarChart2,
  CandlestickChart,
  Grid3X3,
  LayoutGrid,
  FolderTree,
  Layers3,
  ArrowUpDown,
  Workflow,
  Funnel,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ColumnSelect,
  MultiColumnSelect,
  CollapsibleSection,
  ColorSchemePicker,
  CATEGORICAL_SCHEMES,
  SEQUENTIAL_SCHEMES,
} from "./config-controls";
import type { QueryResult } from "@/engine/types";
import type {
  VisualizationType,
  VisualizationConfig,
  ColumnMapping,
  VisualizationOptions,
} from "@/types/dashboard";

/* ─── Props ──────────────────────────────────────────────────── */

interface VizConfigPanelProps {
  config: VisualizationConfig;
  result: QueryResult | null;
  onChangeType: (type: VisualizationType) => void;
  onChangeMapping: (mapping: ColumnMapping) => void;
  onChangeOptions: (options: VisualizationOptions) => void;
}

/* ─── Constants ──────────────────────────────────────────────── */

const VIZ_TYPES: { type: VisualizationType; label: string; icon: typeof BarChart3 }[] = [
  { type: "bar", label: "Bar", icon: BarChart3 },
  { type: "line", label: "Line", icon: LineChart },
  { type: "area", label: "Area", icon: AreaChart },
  { type: "scatter", label: "Scatter", icon: ScatterChart },
  { type: "histogram", label: "Histogram", icon: BarChart2 },
  { type: "box", label: "Box", icon: CandlestickChart },
  { type: "heatmap", label: "Heatmap", icon: Grid3X3 },
  { type: "waffle", label: "Waffle", icon: LayoutGrid },
  { type: "tree", label: "Tree", icon: FolderTree },
  { type: "density", label: "Density", icon: Layers3 },
  { type: "difference", label: "Diff", icon: ArrowUpDown },
  { type: "flow", label: "Flow", icon: Workflow },
  { type: "funnel", label: "Funnel", icon: Funnel },
  { type: "treemap", label: "Treemap", icon: LayoutDashboard },
  { type: "pie", label: "Pie", icon: PieChart },
  { type: "table", label: "Table", icon: Table2 },
  { type: "kpi", label: "KPI", icon: Hash },
];

const PLOT_TYPES = new Set<VisualizationType>([
  "bar", "line", "area", "scatter",
  "histogram", "box", "heatmap", "waffle",
  "tree", "density", "difference", "flow",
]);

const XY_TYPES = new Set<VisualizationType>([
  "bar", "line", "area", "scatter", "waffle",
]);

/* ─── Main Component ─────────────────────────────────────────── */

export function VizConfigPanel({
  config,
  result,
  onChangeType,
  onChangeMapping,
  onChangeOptions,
}: VizConfigPanelProps) {
  const columns = result?.columns.map((c) => c.name) ?? [];
  const { mapping, options } = config;
  const t = config.type;

  const isPlot = PLOT_TYPES.has(t);
  const isXY = XY_TYPES.has(t);

  const updateMapping = (patch: Partial<ColumnMapping>) => {
    onChangeMapping({ ...mapping, ...patch });
  };

  const updateOptions = (patch: Partial<VisualizationOptions>) => {
    onChangeOptions({ ...options, ...patch });
  };

  return (
    <div className="space-y-4">
      {/* ═══ TIER 1: Always visible — type + mapping ═══ */}

      {/* Type selector */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Chart Type
        </label>
        <div className="grid grid-cols-4 gap-1">
          {VIZ_TYPES.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant={t === type ? "default" : "outline"}
              size="sm"
              className="flex h-auto flex-col gap-0.5 px-2 py-1.5 text-xs"
              onClick={() => onChangeType(type)}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Column mappings */}
      {columns.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground">
            Column Mapping
          </div>

          {/* Standard x/y/color: bar, line, area, scatter, waffle */}
          {isXY && (
            <>
              <ColumnSelect
                label="X Axis"
                value={mapping.x}
                columns={columns}
                onChange={(x) => updateMapping({ x })}
              />
              <MultiColumnSelect
                label="Y Axis"
                value={mapping.y}
                columns={columns}
                onChange={(y) => updateMapping({ y })}
              />
              <ColumnSelect
                label="Color"
                value={mapping.color}
                columns={columns}
                onChange={(color) => updateMapping({ color })}
              />
              {t === "scatter" && (
                <ColumnSelect
                  label="Size"
                  value={mapping.size}
                  columns={columns}
                  onChange={(size) => updateMapping({ size })}
                />
              )}
            </>
          )}

          {/* Histogram: X (numeric to bin) + optional Color */}
          {t === "histogram" && (
            <>
              <ColumnSelect
                label="Column (numeric)"
                value={mapping.x}
                columns={columns}
                onChange={(x) => updateMapping({ x })}
              />
              <ColumnSelect
                label="Color (group by)"
                value={mapping.color}
                columns={columns}
                onChange={(color) => updateMapping({ color })}
              />
            </>
          )}

          {/* Box: X (categorical) + Y (numeric) */}
          {t === "box" && (
            <>
              <ColumnSelect
                label="Category (X)"
                value={mapping.x}
                columns={columns}
                onChange={(x) => updateMapping({ x })}
              />
              <ColumnSelect
                label="Value (Y)"
                value={Array.isArray(mapping.y) ? mapping.y[0] : mapping.y}
                columns={columns}
                onChange={(y) => updateMapping({ y })}
              />
            </>
          )}

          {/* Heatmap: X + Y + Value (fill) */}
          {t === "heatmap" && (
            <>
              <ColumnSelect
                label="X Axis"
                value={mapping.x}
                columns={columns}
                onChange={(x) => updateMapping({ x })}
              />
              <ColumnSelect
                label="Y Axis"
                value={Array.isArray(mapping.y) ? mapping.y[0] : mapping.y}
                columns={columns}
                onChange={(y) => updateMapping({ y })}
              />
              <ColumnSelect
                label="Value (fill color)"
                value={mapping.value}
                columns={columns}
                onChange={(value) => updateMapping({ value })}
              />
            </>
          )}

          {/* Tree: path column */}
          {t === "tree" && (
            <>
              <ColumnSelect
                label="Path Column"
                value={mapping.path}
                columns={columns}
                onChange={(path) => updateMapping({ path })}
              />
            </>
          )}

          {/* Density: x + y (reuses standard x/y) */}
          {t === "density" && (
            <>
              <ColumnSelect
                label="X Axis"
                value={mapping.x}
                columns={columns}
                onChange={(x) => updateMapping({ x })}
              />
              <ColumnSelect
                label="Y Axis"
                value={Array.isArray(mapping.y) ? mapping.y[0] : mapping.y}
                columns={columns}
                onChange={(y) => updateMapping({ y })}
              />
              <ColumnSelect
                label="Color (group)"
                value={mapping.color}
                columns={columns}
                onChange={(color) => updateMapping({ color })}
              />
            </>
          )}

          {/* Difference: x + y1 + y2 */}
          {t === "difference" && (
            <>
              <ColumnSelect
                label="X Axis"
                value={mapping.x}
                columns={columns}
                onChange={(x) => updateMapping({ x })}
              />
              <ColumnSelect
                label="Y1 (baseline)"
                value={mapping.y1}
                columns={columns}
                onChange={(y1) => updateMapping({ y1 })}
              />
              <ColumnSelect
                label="Y2 (comparison)"
                value={mapping.y2}
                columns={columns}
                onChange={(y2) => updateMapping({ y2 })}
              />
            </>
          )}

          {/* Flow: x1, y1, x2, y2 */}
          {t === "flow" && (
            <>
              <ColumnSelect
                label="Source X"
                value={mapping.x1}
                columns={columns}
                onChange={(x1) => updateMapping({ x1 })}
              />
              <ColumnSelect
                label="Source Y"
                value={mapping.y1Flow}
                columns={columns}
                onChange={(y1Flow) => updateMapping({ y1Flow })}
              />
              <ColumnSelect
                label="Target X"
                value={mapping.x2}
                columns={columns}
                onChange={(x2) => updateMapping({ x2 })}
              />
              <ColumnSelect
                label="Target Y"
                value={mapping.y2Flow}
                columns={columns}
                onChange={(y2Flow) => updateMapping({ y2Flow })}
              />
              <ColumnSelect
                label="Color"
                value={mapping.color}
                columns={columns}
                onChange={(color) => updateMapping({ color })}
              />
            </>
          )}

          {/* Funnel: category + value (same as pie) */}
          {t === "funnel" && (
            <>
              <ColumnSelect
                label="Stage (category)"
                value={mapping.category}
                columns={columns}
                onChange={(category) => updateMapping({ category })}
              />
              <ColumnSelect
                label="Value"
                value={mapping.value}
                columns={columns}
                onChange={(value) => updateMapping({ value })}
              />
            </>
          )}

          {/* Treemap: path + value */}
          {t === "treemap" && (
            <>
              <ColumnSelect
                label="Path Column"
                value={mapping.path}
                columns={columns}
                onChange={(path) => updateMapping({ path })}
              />
              <ColumnSelect
                label="Value (size)"
                value={mapping.value}
                columns={columns}
                onChange={(value) => updateMapping({ value })}
              />
            </>
          )}

          {/* Pie */}
          {t === "pie" && (
            <>
              <ColumnSelect
                label="Category"
                value={mapping.category}
                columns={columns}
                onChange={(category) => updateMapping({ category })}
              />
              <ColumnSelect
                label="Value"
                value={mapping.value}
                columns={columns}
                onChange={(value) => updateMapping({ value })}
              />
            </>
          )}

          {/* KPI */}
          {t === "kpi" && (
            <>
              <ColumnSelect
                label="Value"
                value={mapping.value}
                columns={columns}
                onChange={(value) => updateMapping({ value })}
              />
              <ColumnSelect
                label="Label"
                value={mapping.label}
                columns={columns}
                onChange={(label) => updateMapping({ label })}
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Prefix
                  </label>
                  <input
                    className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                    placeholder="$"
                    value={options.prefix ?? ""}
                    onChange={(e) =>
                      updateOptions({ prefix: e.target.value || undefined })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Suffix
                  </label>
                  <input
                    className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                    placeholder="%"
                    value={options.suffix ?? ""}
                    onChange={(e) =>
                      updateOptions({ suffix: e.target.value || undefined })
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Type-specific quick options (always visible when relevant) */}
      {(t === "bar" || t === "waffle") && columns.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Options
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={options.horizontal ?? false}
              onChange={(e) =>
                updateOptions({ horizontal: e.target.checked })
              }
            />
            Horizontal
          </label>
        </div>
      )}

      {(t === "line" || t === "area") && columns.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Curve
          </div>
          <div className="flex gap-1">
            {(["linear", "step", "natural"] as const).map((curve) => (
              <Button
                key={curve}
                variant={
                  (options.curve ?? "linear") === curve ? "default" : "outline"
                }
                size="sm"
                className="text-xs capitalize"
                onClick={() => updateOptions({ curve })}
              >
                {curve}
              </Button>
            ))}
          </div>
        </div>
      )}

      {t === "histogram" && columns.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Bins
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={options.thresholds ?? 20}
              onChange={(e) =>
                updateOptions({ thresholds: Number(e.target.value) })
              }
              className="flex-1"
            />
            <span className="w-8 text-right text-xs text-muted-foreground">
              {options.thresholds ?? 20}
            </span>
          </div>
        </div>
      )}

      {(t === "tree" || t === "treemap") && columns.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Path Delimiter
          </div>
          <input
            className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            placeholder="/"
            value={options.treeDelimiter ?? "/"}
            onChange={(e) =>
              updateOptions({ treeDelimiter: e.target.value || "/" })
            }
          />
        </div>
      )}

      {t === "tree" && columns.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Layout
          </div>
          <div className="flex gap-1">
            {(["tidy", "cluster"] as const).map((layout) => (
              <Button
                key={layout}
                variant={
                  (options.treeLayout ?? "tidy") === layout ? "default" : "outline"
                }
                size="sm"
                className="text-xs capitalize"
                onClick={() => updateOptions({ treeLayout: layout })}
              >
                {layout}
              </Button>
            ))}
          </div>
        </div>
      )}

      {t === "density" && columns.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Bandwidth
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={options.densityBandwidth ?? 20}
              onChange={(e) =>
                updateOptions({ densityBandwidth: Number(e.target.value) })
              }
              className="flex-1"
            />
            <span className="w-8 text-right text-xs text-muted-foreground">
              {options.densityBandwidth ?? 20}
            </span>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={options.densityShowPoints !== false}
              onChange={(e) =>
                updateOptions({ densityShowPoints: e.target.checked })
              }
            />
            Show data points
          </label>
        </div>
      )}

      {t === "difference" && columns.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Colors
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Y1 &gt; Y2</label>
              <input
                type="color"
                value={options.positiveFill ?? "#4ade80"}
                onChange={(e) => updateOptions({ positiveFill: e.target.value })}
                className="h-7 w-full cursor-pointer rounded border"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Y2 &gt; Y1</label>
              <input
                type="color"
                value={options.negativeFill ?? "#60a5fa"}
                onChange={(e) => updateOptions({ negativeFill: e.target.value })}
                className="h-7 w-full cursor-pointer rounded border"
              />
            </div>
          </div>
        </div>
      )}

      {t === "funnel" && columns.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Options
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={options.funnelShowPercentage !== false}
              onChange={(e) =>
                updateOptions({ funnelShowPercentage: e.target.checked })
              }
            />
            Show percentages
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={options.funnelShowConversion !== false}
              onChange={(e) =>
                updateOptions({ funnelShowConversion: e.target.checked })
              }
            />
            Show conversion rates
          </label>
        </div>
      )}

      {t === "treemap" && columns.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Tiling
          </div>
          <div className="flex flex-wrap gap-1">
            {(["squarify", "binary", "slice", "dice"] as const).map((tiling) => (
              <Button
                key={tiling}
                variant={
                  (options.treemapTiling ?? "squarify") === tiling ? "default" : "outline"
                }
                size="sm"
                className="text-xs capitalize"
                onClick={() => updateOptions({ treemapTiling: tiling })}
              >
                {tiling}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TIER 2: Customize (collapsed) ═══ */}

      {isPlot && columns.length > 0 && (
        <CollapsibleSection title="Customize">
          {/* Tooltip */}
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={options.showTooltip !== false}
              onChange={(e) =>
                updateOptions({ showTooltip: e.target.checked })
              }
            />
            Show tooltip on hover
          </label>

          {/* Crosshair (line/area) */}
          {(t === "line" || t === "area") && (
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={options.crosshair ?? false}
                onChange={(e) =>
                  updateOptions({ crosshair: e.target.checked })
                }
              />
              Crosshair guide
            </label>
          )}

          {/* Legend */}
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={options.showLegend !== false}
              onChange={(e) =>
                updateOptions({ showLegend: e.target.checked })
              }
            />
            Show legend
          </label>

          {/* Color scheme — sequential for heatmap, categorical for others */}
          {t === "heatmap" ? (
            <ColorSchemePicker
              schemes={SEQUENTIAL_SCHEMES}
              value={options.colorScheme}
              onChange={(s) => updateOptions({ colorScheme: s })}
              defaultScheme="ylgnbu"
            />
          ) : mapping.color ? (
            <ColorSchemePicker
              schemes={CATEGORICAL_SCHEMES}
              value={options.colorScheme}
              onChange={(s) => updateOptions({ colorScheme: s })}
            />
          ) : null}
        </CollapsibleSection>
      )}

      {/* ═══ TIER 3: Advanced (collapsed) — axes, grid, faceting ═══ */}

      {isPlot && columns.length > 0 && (
        <CollapsibleSection title="Advanced">
          {/* Axis labels */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                X Label
              </label>
              <input
                className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                placeholder="Auto"
                value={options.xLabel ?? ""}
                onChange={(e) =>
                  updateOptions({ xLabel: e.target.value || undefined })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Y Label
              </label>
              <input
                className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                placeholder="Auto"
                value={options.yLabel ?? ""}
                onChange={(e) =>
                  updateOptions({ yLabel: e.target.value || undefined })
                }
              />
            </div>
          </div>

          {/* Grid lines */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={options.xGrid ?? false}
                onChange={(e) => updateOptions({ xGrid: e.target.checked })}
              />
              X grid lines
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={options.yGrid ?? false}
                onChange={(e) => updateOptions({ yGrid: e.target.checked })}
              />
              Y grid lines
            </label>
          </div>

          {/* Trend line (scatter/line) */}
          {(t === "scatter" || t === "line") && (
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={options.showTrendLine ?? false}
                onChange={(e) =>
                  updateOptions({ showTrendLine: e.target.checked })
                }
              />
              Trend line (linear regression)
            </label>
          )}

          {/* Normalize (line/area) */}
          {(t === "line" || t === "area") && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Normalize Y
              </label>
              <select
                className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                value={options.normalize ?? ""}
                onChange={(e) =>
                  updateOptions({
                    normalize: (e.target.value || null) as typeof options.normalize,
                  })
                }
              >
                <option value="">None</option>
                <option value="first">Relative to first</option>
                <option value="max">Relative to max</option>
                <option value="sum">Percentage of total</option>
                <option value="mean">Relative to mean</option>
              </select>
            </div>
          )}

          {/* Rolling window (line/area) */}
          {(t === "line" || t === "area") && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Rolling Average
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={options.windowSize ?? 1}
                  onChange={(e) =>
                    updateOptions({
                      windowSize: Number(e.target.value) <= 1 ? undefined : Number(e.target.value),
                    })
                  }
                  className="flex-1"
                />
                <span className="w-8 text-right text-xs text-muted-foreground">
                  {options.windowSize ?? "Off"}
                </span>
              </div>
            </div>
          )}

          {/* Opacity */}
          {isPlot && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Opacity
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.1}
                  value={options.opacity ?? (t === "area" ? 0.3 : 1)}
                  onChange={(e) =>
                    updateOptions({ opacity: Number(e.target.value) })
                  }
                  className="flex-1"
                />
                <span className="w-8 text-right text-xs text-muted-foreground">
                  {(options.opacity ?? (t === "area" ? 0.3 : 1)).toFixed(1)}
                </span>
              </div>
            </div>
          )}

          {/* Stroke width (line/area) */}
          {(t === "line" || t === "area") && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Stroke Width
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0.5}
                  max={5}
                  step={0.5}
                  value={options.strokeWidth ?? 1.5}
                  onChange={(e) =>
                    updateOptions({ strokeWidth: Number(e.target.value) })
                  }
                  className="flex-1"
                />
                <span className="w-8 text-right text-xs text-muted-foreground">
                  {options.strokeWidth ?? 1.5}
                </span>
              </div>
            </div>
          )}

          {/* Scale type */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                X Scale
              </label>
              <select
                className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                value={options.xScaleType ?? ""}
                onChange={(e) =>
                  updateOptions({
                    xScaleType: (e.target.value || undefined) as typeof options.xScaleType,
                  })
                }
              >
                <option value="">Auto</option>
                <option value="linear">Linear</option>
                <option value="log">Log</option>
                <option value="sqrt">Square root</option>
                <option value="time">Time</option>
                <option value="band">Band</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Y Scale
              </label>
              <select
                className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                value={options.yScaleType ?? ""}
                onChange={(e) =>
                  updateOptions({
                    yScaleType: (e.target.value || undefined) as typeof options.yScaleType,
                  })
                }
              >
                <option value="">Auto</option>
                <option value="linear">Linear</option>
                <option value="log">Log</option>
                <option value="sqrt">Square root</option>
                <option value="time">Time</option>
              </select>
            </div>
          </div>

          {/* Scale modifiers */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={options.yZero ?? false}
                onChange={(e) => updateOptions({ yZero: e.target.checked })}
              />
              Y starts at zero
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={options.xReverse ?? false}
                onChange={(e) => updateOptions({ xReverse: e.target.checked })}
              />
              Reverse X
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={options.yReverse ?? false}
                onChange={(e) => updateOptions({ yReverse: e.target.checked })}
              />
              Reverse Y
            </label>
          </div>

          {/* Reference lines */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Reference Lines
            </label>
            {(options.referenceLines ?? []).map((ref, i) => (
              <div key={i} className="flex items-center gap-1">
                <select
                  className="w-12 rounded border bg-background px-1 py-1 text-xs outline-none"
                  value={ref.axis}
                  onChange={(e) => {
                    const lines = [...(options.referenceLines ?? [])];
                    lines[i] = { ...lines[i], axis: e.target.value as "x" | "y" };
                    updateOptions({ referenceLines: lines });
                  }}
                >
                  <option value="y">Y</option>
                  <option value="x">X</option>
                </select>
                <input
                  type="number"
                  className="w-16 rounded border bg-background px-1.5 py-1 text-xs outline-none"
                  placeholder="Value"
                  value={ref.value}
                  onChange={(e) => {
                    const lines = [...(options.referenceLines ?? [])];
                    lines[i] = { ...lines[i], value: Number(e.target.value) };
                    updateOptions({ referenceLines: lines });
                  }}
                />
                <input
                  className="flex-1 rounded border bg-background px-1.5 py-1 text-xs outline-none"
                  placeholder="Label"
                  value={ref.label ?? ""}
                  onChange={(e) => {
                    const lines = [...(options.referenceLines ?? [])];
                    lines[i] = { ...lines[i], label: e.target.value || undefined };
                    updateOptions({ referenceLines: lines });
                  }}
                />
                <button
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    const lines = (options.referenceLines ?? []).filter((_, j) => j !== i);
                    updateOptions({ referenceLines: lines.length ? lines : undefined });
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={() =>
                updateOptions({
                  referenceLines: [
                    ...(options.referenceLines ?? []),
                    { axis: "y", value: 0 },
                  ],
                })
              }
            >
              + Add reference line
            </button>
          </div>

          {/* Faceting (for x/y chart types) */}
          {isXY && (
            <>
              <ColumnSelect
                label="Facet Horizontal"
                value={mapping.fx}
                columns={columns}
                onChange={(fx) => updateMapping({ fx })}
              />
              <ColumnSelect
                label="Facet Vertical"
                value={mapping.fy}
                columns={columns}
                onChange={(fy) => updateMapping({ fy })}
              />
            </>
          )}
        </CollapsibleSection>
      )}
    </div>
  );
}
