import { useState } from "react";
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
  Network,
  FileText,
  ImageIcon,
  Globe,
  Code2,
  TableProperties,
  LayoutList,
  Plus,
  Trash2,
  GripVertical,
  Navigation,
  ChevronDown,
  ChevronRight,
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
  ThresholdRule,
  GroupedTableColumn,
  ColumnFormat,
  NavBarConfig,
  NavBarItem,
  NavBarIcon,
  NavBarItemType,
} from "@/types/dashboard";
import { useDashboardStore } from "@/stores/dashboard-store";
import { createId } from "@/lib/id";

/* ─── Props ──────────────────────────────────────────────────── */

interface VizConfigPanelProps {
  config: VisualizationConfig;
  result: QueryResult | null;
  onChangeType: (type: VisualizationType) => void;
  onChangeMapping: (mapping: ColumnMapping) => void;
  onChangeOptions: (options: VisualizationOptions) => void;
  dashboardId?: string;
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
  { type: "network", label: "Network", icon: Network },
  { type: "custom", label: "Custom", icon: Code2 },
  { type: "combo", label: "Combo", icon: BarChart3 },
  { type: "pie", label: "Pie", icon: PieChart },
  { type: "table", label: "Table", icon: Table2 },
  { type: "grouped-table", label: "Grouped", icon: LayoutList },
  { type: "crosstab", label: "Crosstab", icon: TableProperties },
  { type: "kpi", label: "KPI", icon: Hash },
  { type: "markdown", label: "Text", icon: FileText },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "embed", label: "Embed", icon: Globe },
  { type: "html", label: "HTML", icon: Code2 },
  { type: "nav-bar", label: "Nav Bar", icon: Navigation },
];

const PLOT_TYPES = new Set<VisualizationType>([
  "bar", "line", "area", "scatter",
  "histogram", "box", "heatmap", "waffle",
  "combo", "tree", "density", "difference", "flow",
]);

const XY_TYPES = new Set<VisualizationType>([
  "bar", "line", "area", "scatter", "waffle", "combo",
]);

/* ─── Main Component ─────────────────────────────────────────── */

export function VizConfigPanel({
  config,
  result,
  onChangeType,
  onChangeMapping,
  onChangeOptions,
  dashboardId,
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

          {/* Network: source + target + optional weight */}
          {t === "network" && (
            <>
              <ColumnSelect
                label="Source"
                value={mapping.source}
                columns={columns}
                onChange={(source) => updateMapping({ source })}
              />
              <ColumnSelect
                label="Target"
                value={mapping.target}
                columns={columns}
                onChange={(target) => updateMapping({ target })}
              />
              <ColumnSelect
                label="Weight (optional)"
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

          {/* Grouped table: column role/format editor */}
          {t === "grouped-table" && (
            <GroupedTableEditor
              columns={columns}
              value={options.groupedTableColumns ?? []}
              onChange={(cols) => updateOptions({ groupedTableColumns: cols })}
            />
          )}

          {/* Crosstab: row dim / col dim / measure mapping */}
          {t === "crosstab" && (
            <>
              <ColumnSelect
                label="Row Dimension"
                value={options.crosstabRowDim}
                columns={columns}
                onChange={(v) => updateOptions({ crosstabRowDim: v })}
              />
              <ColumnSelect
                label="Column Dimension"
                value={options.crosstabColDim}
                columns={columns}
                onChange={(v) => updateOptions({ crosstabColDim: v })}
              />
              <ColumnSelect
                label="Measure Value"
                value={options.crosstabMeasure}
                columns={columns}
                onChange={(v) => updateOptions({ crosstabMeasure: v })}
              />
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Aggregation</label>
                <div className="flex flex-wrap gap-1">
                  {(["sum", "avg", "count", "min", "max"] as const).map((fn) => (
                    <Button
                      key={fn}
                      variant={(options.crosstabAggregation ?? "sum") === fn ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      onClick={() => updateOptions({ crosstabAggregation: fn })}
                    >
                      {fn}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Number format (KPI + table) */}
          {(t === "kpi" || t === "table") && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Number Format
              </div>
              <div className="flex flex-wrap gap-1">
                {(["auto", "compact", "currency", "percent", "integer"] as const).map((fmt) => (
                  <Button
                    key={fmt}
                    variant={(options.numberFormat ?? "auto") === fmt ? "default" : "outline"}
                    size="sm"
                    className="text-xs capitalize"
                    onClick={() => updateOptions({ numberFormat: fmt === "auto" ? undefined : fmt })}
                  >
                    {fmt === "compact" ? "1.2M" : fmt === "currency" ? "$1,234" : fmt === "percent" ? "45%" : fmt === "integer" ? "1,234" : "Auto"}
                  </Button>
                ))}
              </div>
              {options.numberFormat === "currency" && (
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Currency</label>
                  <input
                    className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                    placeholder="USD"
                    value={options.currencyCode ?? ""}
                    onChange={(e) => updateOptions({ currencyCode: e.target.value || undefined })}
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Decimal places</label>
                <input
                  type="number"
                  min={0}
                  max={6}
                  className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Auto"
                  value={options.decimals ?? ""}
                  onChange={(e) => updateOptions({ decimals: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>
          )}

          {/* Threshold rules (KPI) */}
          {t === "kpi" && (
            <ThresholdRulesEditor
              rules={options.thresholdRules}
              onChange={(rules) => updateOptions({ thresholdRules: rules })}
            />
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

      {t === "network" && columns.length > 0 && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={options.networkShowLabels !== false}
              onChange={(e) => updateOptions({ networkShowLabels: e.target.checked })}
              className="rounded"
            />
            Show node labels
          </label>
          <div>
            <label className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Node radius</span>
              <span>{options.networkNodeRadius ?? 6}px</span>
            </label>
            <input
              type="range"
              min={3}
              max={20}
              value={options.networkNodeRadius ?? 6}
              onChange={(e) => updateOptions({ networkNodeRadius: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Link distance</span>
              <span>{options.networkLinkDistance ?? 80}px</span>
            </label>
            <input
              type="range"
              min={20}
              max={300}
              value={options.networkLinkDistance ?? 80}
              onChange={(e) => updateOptions({ networkLinkDistance: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Repulsion</span>
              <span>{Math.abs(options.networkCharge ?? 200)}</span>
            </label>
            <input
              type="range"
              min={50}
              max={600}
              value={Math.abs(options.networkCharge ?? 200)}
              onChange={(e) => updateOptions({ networkCharge: -Number(e.target.value) })}
              className="w-full"
            />
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

      {/* ═══ Grouped Table options ═══ */}
      {t === "grouped-table" && (
        <CollapsibleSection title="Table Options">
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Subtotals</label>
              <div className="flex flex-wrap gap-1">
                {(["none", "sql-rollup", "computed"] as const).map((m) => (
                  <Button
                    key={m}
                    variant={(options.groupedTableSubtotals ?? "none") === m ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => updateOptions({ groupedTableSubtotals: m === "none" ? undefined : m })}
                  >
                    {m === "none" ? "None" : m === "sql-rollup" ? "SQL ROLLUP" : "Computed"}
                  </Button>
                ))}
              </div>
              {options.groupedTableSubtotals === "sql-rollup" && (
                <p className="text-[10px] text-muted-foreground">
                  Use GROUP BY ROLLUP(…) in your SQL. Rows with null dimension values are styled as subtotals.
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={options.groupedTableShowGrandTotal ?? false}
                onChange={(e) => updateOptions({ groupedTableShowGrandTotal: e.target.checked || undefined })}
              />
              Show grand total
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={options.groupedTableStriped ?? true}
                onChange={(e) => updateOptions({ groupedTableStriped: e.target.checked })}
              />
              Zebra striping
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={options.groupedTableCompact ?? false}
                onChange={(e) => updateOptions({ groupedTableCompact: e.target.checked || undefined })}
              />
              Compact rows
            </label>
          </div>
        </CollapsibleSection>
      )}

      {/* ═══ Nav Bar config ═══ */}
      {t === "nav-bar" && (
        <NavBarConfigEditor
          value={options.navBarConfig ?? { orientation: "horizontal", items: [] }}
          onChange={(cfg) => updateOptions({ navBarConfig: cfg })}
          dashboardId={dashboardId}
        />
      )}

      {/* ═══ Crosstab options ═══ */}
      {t === "crosstab" && (
        <CollapsibleSection title="Crosstab Options">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={options.crosstabShowRowTotals ?? false}
                onChange={(e) => updateOptions({ crosstabShowRowTotals: e.target.checked || undefined })}
              />
              Show row totals
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={options.crosstabShowColTotals ?? false}
                onChange={(e) => updateOptions({ crosstabShowColTotals: e.target.checked || undefined })}
              />
              Show column totals
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={options.crosstabColorScale ?? false}
                onChange={(e) => updateOptions({ crosstabColorScale: e.target.checked || undefined })}
              />
              Color scale (heat map)
            </label>
            {options.crosstabColorScale && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Min color</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      className="h-6 w-10 cursor-pointer rounded border"
                      value={options.crosstabColorMin ?? "#ffffff"}
                      onChange={(e) => updateOptions({ crosstabColorMin: e.target.value })}
                    />
                    <input
                      className="flex-1 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] outline-none"
                      value={options.crosstabColorMin ?? "#ffffff"}
                      onChange={(e) => updateOptions({ crosstabColorMin: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Max color</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      className="h-6 w-10 cursor-pointer rounded border"
                      value={options.crosstabColorMax ?? "#2563eb"}
                      onChange={(e) => updateOptions({ crosstabColorMax: e.target.value })}
                    />
                    <input
                      className="flex-1 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] outline-none"
                      value={options.crosstabColorMax ?? "#2563eb"}
                      onChange={(e) => updateOptions({ crosstabColorMax: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

/* ── Threshold Rules Editor ──────────────────────── */

const OPERATORS: { value: ThresholdRule["operator"]; label: string }[] = [
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
  { value: "between", label: "between" },
];

function ThresholdRulesEditor({
  rules,
  onChange,
}: {
  rules?: ThresholdRule[];
  onChange: (rules: ThresholdRule[] | undefined) => void;
}) {
  const items = rules ?? [];

  const update = (index: number, patch: Partial<ThresholdRule>) => {
    const next = items.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onChange(next);
  };

  const remove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : undefined);
  };

  const add = () => {
    onChange([
      ...items,
      { operator: "gt", value: 0, color: "#16a34a", bgColor: "#dcfce7" },
    ]);
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">
        Threshold Rules
      </div>
      {items.map((rule, i) => (
        <div key={i} className="space-y-1 rounded border border-border/40 p-2">
          <div className="flex items-center gap-1">
            <select
              className="w-20 rounded border bg-background px-1 py-1 text-xs outline-none"
              value={rule.operator}
              onChange={(e) =>
                update(i, { operator: e.target.value as ThresholdRule["operator"] })
              }
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="w-16 rounded border bg-background px-1.5 py-1 text-xs outline-none"
              value={rule.value}
              onChange={(e) => update(i, { value: Number(e.target.value) })}
            />
            {rule.operator === "between" && (
              <>
                <span className="text-[10px] text-muted-foreground">and</span>
                <input
                  type="number"
                  className="w-16 rounded border bg-background px-1.5 py-1 text-xs outline-none"
                  value={rule.value2 ?? 0}
                  onChange={(e) => update(i, { value2: Number(e.target.value) })}
                />
              </>
            )}
            <button
              className="ml-auto text-xs text-muted-foreground hover:text-destructive"
              onClick={() => remove(i)}
            >
              ×
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">Text</span>
              <input
                type="color"
                value={rule.color}
                onChange={(e) => update(i, { color: e.target.value })}
                className="h-5 w-5 cursor-pointer rounded border border-border/40"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">Bg</span>
              <input
                type="color"
                value={rule.bgColor ?? "#ffffff"}
                onChange={(e) => update(i, { bgColor: e.target.value })}
                className="h-5 w-5 cursor-pointer rounded border border-border/40"
              />
            </div>
            <input
              className="flex-1 rounded border bg-background px-1.5 py-0.5 text-[10px] outline-none"
              placeholder="Label (optional)"
              value={rule.label ?? ""}
              onChange={(e) => update(i, { label: e.target.value || undefined })}
            />
          </div>
        </div>
      ))}
      <button
        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        onClick={add}
      >
        + Add threshold rule
      </button>
    </div>
  );
}

/* ── Grouped Table Column Editor ─────────────────── */

function ColumnFormatEditor({
  fmt,
  onChange,
}: {
  fmt: ColumnFormat | undefined;
  onChange: (f: ColumnFormat | undefined) => void;
}) {
  const f = fmt ?? {};
  const upd = (patch: Partial<ColumnFormat>) => onChange({ ...f, ...patch });

  return (
    <div className="space-y-2 rounded border border-border/30 bg-muted/20 p-2">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="space-y-0.5">
          <label className="text-[10px] text-muted-foreground">Header label</label>
          <input
            className="w-full rounded border bg-background px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring"
            placeholder="(column name)"
            value={f.label ?? ""}
            onChange={(e) => upd({ label: e.target.value || undefined })}
          />
        </div>
        <div className="space-y-0.5">
          <label className="text-[10px] text-muted-foreground">Width</label>
          <input
            className="w-full rounded border bg-background px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring"
            placeholder="120px or 20%"
            value={f.width ?? ""}
            onChange={(e) => upd({ width: e.target.value || undefined })}
          />
        </div>
      </div>
      <div className="space-y-0.5">
        <label className="text-[10px] text-muted-foreground">Number format</label>
        <div className="flex flex-wrap gap-1">
          {(["auto", "compact", "percent", "currency", "integer"] as const).map((fmt) => (
            <Button
              key={fmt}
              variant={(f.numberFormat ?? "auto") === fmt ? "default" : "outline"}
              size="sm"
              className="h-5 px-1.5 text-[10px]"
              onClick={() => upd({ numberFormat: fmt === "auto" ? undefined : fmt })}
            >
              {fmt === "compact" ? "1.2M" : fmt === "currency" ? "$" : fmt === "percent" ? "%" : fmt === "integer" ? "#" : "Auto"}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <div className="space-y-0.5">
          <label className="text-[10px] text-muted-foreground">Align</label>
          <div className="flex gap-0.5">
            {(["left", "center", "right"] as const).map((a) => (
              <Button
                key={a}
                variant={(f.align ?? "left") === a ? "default" : "outline"}
                size="sm"
                className="h-5 w-7 p-0 text-[10px]"
                onClick={() => upd({ align: a })}
              >
                {a[0].toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-0.5">
          <label className="text-[10px] text-muted-foreground">Text color</label>
          <input
            type="color"
            className="h-6 w-full cursor-pointer rounded border"
            value={f.textColor ?? "#000000"}
            onChange={(e) => upd({ textColor: e.target.value })}
          />
        </div>
        <div className="space-y-0.5">
          <label className="text-[10px] text-muted-foreground">Cell bg</label>
          <input
            type="color"
            className="h-6 w-full cursor-pointer rounded border"
            value={f.bgColor ?? "#ffffff"}
            onChange={(e) => upd({ bgColor: e.target.value })}
          />
        </div>
      </div>
      <ThresholdRulesEditor
        rules={f.thresholdRules}
        onChange={(rules) => upd({ thresholdRules: rules })}
      />
    </div>
  );
}

function GroupedTableEditor({
  columns,
  value,
  onChange,
}: {
  columns: string[];
  value: GroupedTableColumn[];
  onChange: (cols: GroupedTableColumn[]) => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const add = (col: string) => {
    if (value.some((c) => c.column === col)) return;
    onChange([...value, { column: col, role: "measure" }]);
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
    if (expanded === idx) setExpanded(null);
  };

  const update = (idx: number, patch: Partial<GroupedTableColumn>) => {
    onChange(value.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const unusedCols = columns.filter((c) => !value.some((v) => v.column === c));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">Column Configuration</label>
        <span className="text-[10px] text-muted-foreground">{value.length} configured</span>
      </div>

      {value.length === 0 && (
        <p className="text-[10px] text-muted-foreground italic">
          Add columns below. Dimensions group rows; measures show values.
        </p>
      )}

      {/* Configured columns list */}
      {value.map((col, idx) => (
        <div key={col.column} className="rounded border border-border/40 bg-background">
          <div className="flex items-center gap-1 px-2 py-1">
            <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/50" />
            <span className="flex-1 truncate text-xs font-medium">{col.column}</span>
            {/* Role toggle */}
            <Button
              variant={col.role === "dimension" ? "default" : "outline"}
              size="sm"
              className="h-5 px-1.5 text-[10px]"
              onClick={() => update(idx, { role: col.role === "dimension" ? "measure" : "dimension" })}
              title="Toggle dimension/measure"
            >
              {col.role === "dimension" ? "Dim" : "Val"}
            </Button>
            {/* Format expand */}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-[10px]"
              onClick={() => setExpanded(expanded === idx ? null : idx)}
              title="Column formatting"
            >
              {expanded === idx ? "▲" : "▼"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-destructive hover:text-destructive"
              onClick={() => remove(idx)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          {expanded === idx && (
            <div className="border-t border-border/30 p-2">
              <ColumnFormatEditor
                fmt={col.format}
                onChange={(fmt) => update(idx, { format: fmt })}
              />
            </div>
          )}
        </div>
      ))}

      {/* Add column dropdown */}
      {unusedCols.length > 0 && (
        <div className="flex items-center gap-1">
          <select
            className="flex-1 rounded border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) add(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="">+ Add column…</option>
            {unusedCols.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {columns.length > 0 && value.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px]"
              onClick={() => onChange(columns.map((c) => ({ column: c, role: "measure" as const })))}
            >
              <Plus className="mr-1 h-3 w-3" />
              All
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Nav Bar Config Editor ───────────────────────────── */

const NAV_ICONS: NavBarIcon[] = [
  "home", "bar-chart", "table", "settings", "star", "info", "file", "users",
  "arrow-right", "layout-dashboard", "database", "layers", "globe", "mail",
  "bell", "search", "bookmark", "tag", "folder", "calendar", "clock", "map",
  "trending-up", "trending-down", "activity", "alert-triangle", "check-circle",
  "x-circle", "link",
];

const ITEM_TYPES: { value: NavBarItemType; label: string }[] = [
  { value: "tab", label: "Tab" },
  { value: "url", label: "URL" },
  { value: "label", label: "Label" },
  { value: "divider", label: "Divider" },
];

function NavBarItemRow({
  item,
  tabs,
  depth,
  onChange,
  onRemove,
}: {
  item: NavBarItem;
  tabs: { id: string; label: string }[];
  depth: number;
  onChange: (item: NavBarItem) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const upd = (patch: Partial<NavBarItem>) => onChange({ ...item, ...patch });

  const addChild = () => {
    const child: NavBarItem = { id: createId(), label: "New Item", type: "tab" };
    upd({ children: [...(item.children ?? []), child] });
  };

  const updateChild = (idx: number, c: NavBarItem) => {
    const children = (item.children ?? []).map((x, i) => (i === idx ? c : x));
    upd({ children });
  };

  const removeChild = (idx: number) => {
    upd({ children: (item.children ?? []).filter((_, i) => i !== idx) });
  };

  return (
    <div className={depth > 0 ? "ml-4 border-l border-border/30 pl-3" : ""}>
      <div className="flex items-center gap-1">
        <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

        {/* Type */}
        <select
          className="w-16 rounded border bg-background px-1 py-0.5 text-xs outline-none"
          value={item.type}
          onChange={(e) => upd({ type: e.target.value as NavBarItemType })}
        >
          {ITEM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Label */}
        {item.type !== "divider" && (
          <input
            className="min-w-0 flex-1 rounded border bg-background px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring"
            placeholder="Label"
            value={item.label}
            onChange={(e) => upd({ label: e.target.value })}
          />
        )}

        {/* Expand / collapse (for non-divider/label at depth 0) */}
        {depth === 0 && item.type !== "divider" && item.type !== "label" && (
          <button
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent"
            onClick={() => setExpanded((v) => !v)}
            title="Edit details / sub-items"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}

        <button
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && item.type !== "divider" && (
        <div className="mt-1.5 space-y-1.5 rounded border border-border/30 bg-muted/20 p-2">
          {/* Tab target */}
          {item.type === "tab" && (
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Tab</label>
              {tabs.length > 0 ? (
                <select
                  className="w-full rounded border bg-background px-1.5 py-0.5 text-xs outline-none"
                  value={item.tabId ?? ""}
                  onChange={(e) => upd({ tabId: e.target.value || undefined })}
                >
                  <option value="">— select tab —</option>
                  {tabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>{tab.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="w-full rounded border bg-background px-1.5 py-0.5 text-xs outline-none"
                  placeholder="Tab ID"
                  value={item.tabId ?? ""}
                  onChange={(e) => upd({ tabId: e.target.value || undefined })}
                />
              )}
              {tabs.length === 0 && (
                <p className="text-[10px] text-muted-foreground">Add tabs in the Config tab first</p>
              )}
            </div>
          )}

          {/* URL target */}
          {item.type === "url" && (
            <>
              <div className="space-y-0.5">
                <label className="text-[10px] text-muted-foreground">URL</label>
                <input
                  className="w-full rounded border bg-background px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                  placeholder="https://..."
                  value={item.url ?? ""}
                  onChange={(e) => upd({ url: e.target.value || undefined })}
                />
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={item.openInNew ?? false}
                  onChange={(e) => upd({ openInNew: e.target.checked || undefined })}
                />
                Open in new tab
              </label>
            </>
          )}

          {/* Icon */}
          <div className="space-y-0.5">
            <label className="text-[10px] text-muted-foreground">Icon</label>
            <select
              className="w-full rounded border bg-background px-1.5 py-0.5 text-xs outline-none"
              value={item.icon ?? ""}
              onChange={(e) => upd({ icon: (e.target.value as NavBarIcon) || undefined })}
            >
              <option value="">— none —</option>
              {NAV_ICONS.map((icon) => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>
          </div>

          {/* Sub-items (only at depth 0) */}
          {depth === 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-muted-foreground">
                  Sub-items (dropdown)
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px]"
                  onClick={addChild}
                >
                  <Plus className="mr-0.5 h-3 w-3" />
                  Add
                </Button>
              </div>
              {(item.children ?? []).map((child, idx) => (
                <NavBarItemRow
                  key={child.id}
                  item={child}
                  tabs={tabs}
                  depth={1}
                  onChange={(c) => updateChild(idx, c)}
                  onRemove={() => removeChild(idx)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NavBarConfigEditor({
  value: cfg,
  onChange,
  dashboardId,
}: {
  value: NavBarConfig;
  onChange: (cfg: NavBarConfig) => void;
  dashboardId?: string;
}) {
  const dashboard = useDashboardStore((s) =>
    dashboardId ? s.dashboards[dashboardId] : undefined,
  );
  const tabs = dashboard?.tabs ?? [];

  const upd = (patch: Partial<NavBarConfig>) => onChange({ ...cfg, ...patch });

  const addItem = () => {
    const item: NavBarItem = { id: createId(), label: "New Item", type: "tab" };
    upd({ items: [...cfg.items, item] });
  };

  const updateItem = (idx: number, item: NavBarItem) => {
    upd({ items: cfg.items.map((x, i) => (i === idx ? item : x)) });
  };

  const removeItem = (idx: number) => {
    upd({ items: cfg.items.filter((_, i) => i !== idx) });
  };

  const ITEM_STYLE_OPTS: NavBarConfig["itemStyle"][] = ["plain", "pill", "underline", "bordered"];
  const ALIGN_OPTS: NavBarConfig["alignment"][] = ["left", "center", "right", "space-between"];
  const WEIGHT_OPTS: NavBarConfig["fontWeight"][] = ["normal", "medium", "semibold", "bold"];

  return (
    <div className="space-y-3">
      {/* ── Items ── */}
      <CollapsibleSection title="Nav Items" defaultOpen>
        <div className="space-y-1.5">
          {cfg.items.map((item, idx) => (
            <NavBarItemRow
              key={item.id}
              item={item}
              tabs={tabs}
              depth={0}
              onChange={(updated) => updateItem(idx, updated)}
              onRemove={() => removeItem(idx)}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={addItem}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Item
          </Button>
        </div>
      </CollapsibleSection>

      {/* ── Layout ── */}
      <CollapsibleSection title="Layout">
        <div className="space-y-2">
          {/* Orientation */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Orientation</label>
            <div className="flex gap-1">
              {(["horizontal", "vertical"] as const).map((o) => (
                <Button
                  key={o}
                  variant={cfg.orientation === o ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs h-7"
                  onClick={() => upd({ orientation: o })}
                >
                  {o === "horizontal" ? "Horizontal" : "Vertical"}
                </Button>
              ))}
            </div>
          </div>

          {/* Alignment (horizontal only) */}
          {cfg.orientation === "horizontal" && (
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Alignment</label>
              <div className="grid grid-cols-4 gap-1">
                {ALIGN_OPTS.map((a) => (
                  <Button
                    key={a}
                    variant={(cfg.alignment ?? "left") === a ? "default" : "outline"}
                    size="sm"
                    className="text-[10px] h-6 px-1"
                    onClick={() => upd({ alignment: a })}
                  >
                    {a === "space-between" ? "spread" : a}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Brand */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Brand label</label>
            <input
              className="w-full rounded border bg-background px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring"
              placeholder="My App"
              value={cfg.brandLabel ?? ""}
              onChange={(e) => upd({ brandLabel: e.target.value || undefined })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Logo URL</label>
            <input
              className="w-full rounded border bg-background px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring"
              placeholder="https://..."
              value={cfg.brandLogoUrl ?? ""}
              onChange={(e) => upd({ brandLogoUrl: e.target.value || undefined })}
            />
          </div>
          {(cfg.brandLogoUrl || cfg.brandLabel) && (
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Logo size (px)</label>
              <input
                type="number"
                className="w-full rounded border bg-background px-1.5 py-0.5 text-xs outline-none"
                min={12} max={80}
                value={cfg.brandLogoSize ?? 24}
                onChange={(e) => upd({ brandLogoSize: Number(e.target.value) })}
              />
            </div>
          )}

          {/* Vertical collapsible */}
          {cfg.orientation === "vertical" && (
            <>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={cfg.sectionCollapsible ?? false}
                  onChange={(e) => upd({ sectionCollapsible: e.target.checked || undefined })}
                />
                Sections collapsible
              </label>
              {cfg.sectionCollapsible && (
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={cfg.sectionDefaultCollapsed ?? false}
                    onChange={(e) => upd({ sectionDefaultCollapsed: e.target.checked || undefined })}
                  />
                  Start collapsed
                </label>
              )}
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Child indent (px)</label>
                <input
                  type="number"
                  className="w-full rounded border bg-background px-1.5 py-0.5 text-xs outline-none"
                  min={0} max={48} step={4}
                  value={cfg.childIndent ?? 16}
                  onChange={(e) => upd({ childIndent: Number(e.target.value) })}
                />
              </div>
            </>
          )}
        </div>
      </CollapsibleSection>

      {/* ── Style ── */}
      <CollapsibleSection title="Style">
        <div className="space-y-2">
          {/* Item style */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Item style</label>
            <div className="grid grid-cols-4 gap-1">
              {ITEM_STYLE_OPTS.map((s) => (
                <Button
                  key={s}
                  variant={(cfg.itemStyle ?? "plain") === s ? "default" : "outline"}
                  size="sm"
                  className="text-[10px] h-6 px-1"
                  onClick={() => upd({ itemStyle: s })}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-2">
            {([
              ["background", "Background"],
              ["textColor", "Text"],
              ["activeTextColor", "Active text"],
              ["activeBgColor", "Active bg"],
              ["hoverBgColor", "Hover bg"],
              ["dividerColor", "Divider"],
            ] as const).map(([key, label]) => (
              <div key={key} className="space-y-0.5">
                <label className="text-[10px] text-muted-foreground">{label}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    className="h-6 w-8 cursor-pointer rounded border"
                    value={cfg[key] ?? "#ffffff"}
                    onChange={(e) => upd({ [key]: e.target.value })}
                  />
                  <input
                    className="min-w-0 flex-1 rounded border bg-background px-1 py-0.5 font-mono text-[10px] outline-none"
                    value={cfg[key] ?? ""}
                    placeholder="auto"
                    onChange={(e) => upd({ [key]: e.target.value || undefined })}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Border/frame */}
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={cfg.showOuterBorder ?? false}
              onChange={(e) => upd({ showOuterBorder: e.target.checked || undefined })}
            />
            Show outer border
          </label>
          {cfg.showOuterBorder && (
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Border color</label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  className="h-6 w-8 cursor-pointer rounded border"
                  value={cfg.outerBorderColor ?? "#e2e8f0"}
                  onChange={(e) => upd({ outerBorderColor: e.target.value })}
                />
                <input
                  className="flex-1 rounded border bg-background px-1 py-0.5 font-mono text-[10px] outline-none"
                  value={cfg.outerBorderColor ?? ""}
                  onChange={(e) => upd({ outerBorderColor: e.target.value || undefined })}
                />
              </div>
            </div>
          )}
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={cfg.showDividers ?? false}
              onChange={(e) => upd({ showDividers: e.target.checked || undefined })}
            />
            Show dividers between items
          </label>
        </div>
      </CollapsibleSection>

      {/* ── Typography ── */}
      <CollapsibleSection title="Typography">
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Font size (px)</label>
              <input
                type="number"
                className="w-full rounded border bg-background px-1.5 py-0.5 text-xs outline-none"
                min={10} max={24}
                value={cfg.fontSize ?? 13}
                onChange={(e) => upd({ fontSize: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Letter spacing (em)</label>
              <input
                type="number"
                className="w-full rounded border bg-background px-1.5 py-0.5 text-xs outline-none"
                min={0} max={0.3} step={0.01}
                value={cfg.letterSpacing ?? 0}
                onChange={(e) => upd({ letterSpacing: Number(e.target.value) || undefined })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Font weight</label>
            <div className="grid grid-cols-4 gap-1">
              {WEIGHT_OPTS.map((w) => (
                <Button
                  key={w}
                  variant={(cfg.fontWeight ?? "normal") === w ? "default" : "outline"}
                  size="sm"
                  className="text-[10px] h-6 px-1"
                  onClick={() => upd({ fontWeight: w })}
                >
                  {w}
                </Button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={cfg.uppercase ?? false}
              onChange={(e) => upd({ uppercase: e.target.checked || undefined })}
            />
            Uppercase labels
          </label>
        </div>
      </CollapsibleSection>

      {/* ── Spacing ── */}
      <CollapsibleSection title="Spacing">
        <div className="space-y-2">
          {([
            ["itemPaddingX", "Item padding X (px)", 0, 48, 12],
            ["itemPaddingY", "Item padding Y (px)", 0, 32, 6],
            ["gap", "Gap between items (px)", 0, 32, 2],
            ["borderRadius", "Border radius (px)", 0, 24, 6],
          ] as const).map(([key, label, min, max, def]) => (
            <div key={key} className="flex items-center gap-2">
              <label className="w-36 shrink-0 text-[10px] text-muted-foreground">{label}</label>
              <input
                type="range"
                className="flex-1"
                min={min} max={max}
                value={cfg[key] ?? def}
                onChange={(e) => upd({ [key]: Number(e.target.value) })}
              />
              <span className="w-6 text-right text-[10px] tabular-nums text-muted-foreground">
                {cfg[key] ?? def}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* ── Icons ── */}
      <CollapsibleSection title="Icons">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={cfg.showIcons ?? false}
              onChange={(e) => upd({ showIcons: e.target.checked || undefined })}
            />
            Show icons next to labels
          </label>
          {cfg.showIcons && (
            <div className="flex items-center gap-2">
              <label className="w-24 shrink-0 text-[10px] text-muted-foreground">Icon size (px)</label>
              <input
                type="range"
                className="flex-1"
                min={10} max={24}
                value={cfg.iconSize ?? 14}
                onChange={(e) => upd({ iconSize: Number(e.target.value) })}
              />
              <span className="w-6 text-right text-[10px] tabular-nums text-muted-foreground">
                {cfg.iconSize ?? 14}
              </span>
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}
