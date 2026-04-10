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
  Braces,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ColumnSelect,
  MultiColumnSelect,
  CollapsibleSection,
  ColorSchemePicker,
  SliderWithNumber,
  HexColorInput,
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
import { useEngine } from "@/engine/use-engine";
import { createId } from "@/lib/id";
import { buildCrosstabPivotSQL, isCrosstabReady } from "@/lib/crosstab-sql";
import { JsonEditor } from "@/components/query/json-editor";

/* ─── Props ──────────────────────────────────────────────────── */

interface VizConfigPanelProps {
  config: VisualizationConfig;
  result: QueryResult | null;
  onChangeType: (type: VisualizationType) => void;
  onChangeMapping: (mapping: ColumnMapping) => void;
  onChangeOptions: (options: VisualizationOptions) => void;
  /** Called with the generated PIVOT SQL whenever crosstab config is complete */
  onChangeSql?: (sql: string) => void;
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
  { type: "vega-lite", label: "Vega-Lite", icon: Braces },
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

const DEFAULT_VEGA_LITE_SPEC = JSON.stringify(
  {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    mark: "bar",
    encoding: {
      x: { field: "x", type: "ordinal" },
      y: { field: "y", type: "quantitative" },
    },
  },
  null,
  2,
);

/* ─── Main Component ─────────────────────────────────────────── */

export function VizConfigPanel({
  config,
  result,
  onChangeType,
  onChangeMapping,
  onChangeOptions,
  onChangeSql,
  dashboardId,
}: VizConfigPanelProps) {
  const columns = result?.columns.map((c) => c.name) ?? [];
  const { mapping, options } = config;
  const t = config.type;
  const engine = useEngine();
  const [crosstabSourceRunning, setCrosstabSourceRunning] = useState(false);

  const isPlot = PLOT_TYPES.has(t);
  const isXY = XY_TYPES.has(t);
  const [configTab, setConfigTab] = useState<"style" | "axes" | "transform" | "advanced">("style");

  /** Merge a patch into options, then regenerate PIVOT SQL if crosstab is fully configured */
  function updateCrosstabOption(patch: Partial<VisualizationOptions>) {
    const merged = { ...options, ...patch };
    onChangeOptions(merged);
    if (isCrosstabReady(merged) && onChangeSql) {
      onChangeSql(buildCrosstabPivotSQL({
        sourceSql: merged.crosstabSourceSql!,
        rowDim: merged.crosstabRowDim!,
        colDim: merged.crosstabColDim!,
        measure: merged.crosstabMeasure!,
        aggFn: merged.crosstabAggregation ?? "sum",
      }));
    }
  }

  async function handleRunCrosstabSource() {
    const sql = options.crosstabSourceSql?.trim();
    if (!sql) return;
    setCrosstabSourceRunning(true);
    try {
      const r = await engine.executeQuery(sql);
      const cols = r.columns.map((c) => c.name);
      updateCrosstabOption({ crosstabSourceColumns: cols });
    } catch { /* ignore — user will see no columns */ }
    finally { setCrosstabSourceRunning(false); }
  }

  const updateMapping = (patch: Partial<ColumnMapping>) => {
    onChangeMapping({ ...mapping, ...patch });
  };

  const updateOptions = (patch: Partial<VisualizationOptions>) => {
    onChangeOptions({ ...options, ...patch });
  };

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* ═══ TIER 1: Always visible — mapping ═══ */}

      {/* Vega-Lite JSON editor */}
      {t === "vega-lite" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Vega-Lite Spec (JSON)
            </label>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
              onClick={() => updateOptions({ vegaLiteSpec: DEFAULT_VEGA_LITE_SPEC })}
              title="Reset to default spec"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          </div>
          <div style={{ height: 300 }}>
            <JsonEditor
              value={options.vegaLiteSpec ?? DEFAULT_VEGA_LITE_SPEC}
              onChange={(spec) => updateOptions({ vegaLiteSpec: spec })}
              height="300px"
            />
          </div>
          {result && result.rows.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Query results ({result.rows.length} rows) are auto-injected as{" "}
              <code>data.values</code> — omit the <code>data</code> key in your spec.
            </p>
          )}
        </div>
      )}

      {/* Column mappings — hidden for vega-lite (spec handles its own encoding) */}
      {t !== "vega-lite" && columns.length > 0 && (
        <div className="space-y-3" style={{ padding: "4px 12px 8px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
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

          {/* Crosstab: source SQL + dim/measure pickers → generates DuckDB PIVOT SQL */}
          {t === "crosstab" && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Source Query</label>
                <textarea
                  className="w-full rounded border bg-background px-2 py-1.5 font-mono text-xs outline-none focus:ring-1 focus:ring-ring resize-none"
                  rows={4}
                  placeholder={"SELECT region, product, revenue\nFROM sales"}
                  value={options.crosstabSourceSql ?? ""}
                  onChange={(e) => updateCrosstabOption({ crosstabSourceSql: e.target.value })}
                  spellCheck={false}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs w-full"
                  disabled={!options.crosstabSourceSql?.trim() || crosstabSourceRunning}
                  onClick={handleRunCrosstabSource}
                >
                  {crosstabSourceRunning ? "Running…" : "Preview columns"}
                </Button>
                {options.crosstabSourceColumns && (
                  <p className="text-[10px] text-muted-foreground">
                    Columns: {options.crosstabSourceColumns.join(", ")}
                  </p>
                )}
              </div>
              <ColumnSelect
                label="Row Dimension (GROUP BY)"
                value={options.crosstabRowDim}
                columns={options.crosstabSourceColumns ?? []}
                onChange={(v) => updateCrosstabOption({ crosstabRowDim: v })}
              />
              <ColumnSelect
                label="Column Dimension (PIVOT ON)"
                value={options.crosstabColDim}
                columns={options.crosstabSourceColumns ?? []}
                onChange={(v) => updateCrosstabOption({ crosstabColDim: v })}
              />
              <ColumnSelect
                label="Measure (USING)"
                value={options.crosstabMeasure}
                columns={options.crosstabSourceColumns ?? []}
                onChange={(v) => updateCrosstabOption({ crosstabMeasure: v })}
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
                      onClick={() => updateCrosstabOption({ crosstabAggregation: fn })}
                    >
                      {fn}
                    </Button>
                  ))}
                </div>
              </div>
              {isCrosstabReady(options) && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Generated SQL</label>
                  <pre className="rounded border bg-muted px-2 py-1.5 font-mono text-[10px] text-muted-foreground whitespace-pre overflow-auto">
                    {buildCrosstabPivotSQL({
                      sourceSql: options.crosstabSourceSql!,
                      rowDim: options.crosstabRowDim!,
                      colDim: options.crosstabColDim!,
                      measure: options.crosstabMeasure!,
                      aggFn: options.crosstabAggregation ?? "sum",
                    })}
                  </pre>
                </div>
              )}
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
          {t === "bar" && (
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={options.showBarLabels ?? false}
                onChange={(e) => updateOptions({ showBarLabels: e.target.checked || undefined })}
              />
              Show value labels
            </label>
          )}
          {t === "bar" && Array.isArray(mapping.y) && mapping.y.length > 1 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Multi-series</label>
              <div className="flex gap-1">
                {(["Stacked", "Grouped"] as const).map((mode) => (
                  <Button
                    key={mode}
                    variant={(options.stacked === false ? "Grouped" : "Stacked") === mode ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => updateOptions({ stacked: mode === "Grouped" ? false : undefined })}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {t === "bar" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Sort bars</label>
              <div className="flex gap-1">
                {([
                  { value: null, label: "Default" },
                  { value: "desc", label: "↓ Value" },
                  { value: "asc", label: "↑ Value" },
                ] as const).map(({ value, label }) => (
                  <Button
                    key={label}
                    variant={(options.barSort ?? null) === value ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => updateOptions({ barSort: value ?? undefined })}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          )}
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
          {t === "line" && (
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={options.showLinePoints ?? false}
                onChange={(e) => updateOptions({ showLinePoints: e.target.checked || undefined })}
              />
              Show data point markers
            </label>
          )}
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

      {/* ═══ TIER 2/3: Tabbed customization panel for Plot types ═══ */}

      {isPlot && (
        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
          {/* Tab bar */}
          <div style={{ display: "flex", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            {(["style", "axes", "transform", "advanced"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setConfigTab(tab)}
                style={{
                  flex: 1,
                  padding: "6px 2px 5px",
                  border: "none",
                  borderBottom: configTab === tab
                    ? "2px solid var(--color-text-primary)"
                    : "2px solid transparent",
                  background: "transparent",
                  color: configTab === tab
                    ? "var(--color-text-primary)"
                    : "var(--color-muted-foreground)",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 500,
                  textTransform: "capitalize",
                  marginBottom: -1,
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── Style tab ── */}
          {configTab === "style" && (
            <div className="space-y-3 p-3">
              {/* Chart title / subtitle */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Chart Title</label>
                <input
                  className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Optional chart title"
                  value={options.chartTitle ?? ""}
                  onChange={(e) => updateOptions({ chartTitle: e.target.value || undefined })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Subtitle</label>
                <input
                  className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Optional subtitle"
                  value={options.chartSubtitle ?? ""}
                  onChange={(e) => updateOptions({ chartSubtitle: e.target.value || undefined })}
                />
              </div>

              {/* Mark color — only when no color column drives fill */}
              {!mapping.color && (t === "bar" || t === "line" || t === "area" || t === "scatter" || t === "histogram" || t === "waffle") && (
                <HexColorInput
                  label="Mark Color"
                  value={options.markColor}
                  placeholder="#6b7280"
                  onChange={(v) => updateOptions({ markColor: v })}
                  onClear={() => updateOptions({ markColor: undefined })}
                />
              )}

              {/* Bar polish */}
              {t === "bar" && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-muted-foreground">Bar Style</label>
                  <SliderWithNumber
                    label="Corner radius (px)"
                    value={options.barCornerRadius}
                    min={0} max={20} step={1} defaultValue={0}
                    onChange={(v) => updateOptions({ barCornerRadius: v || undefined })}
                  />
                  <SliderWithNumber
                    label="Bar spacing (px)"
                    value={options.barInset}
                    min={0} max={12} step={0.5} defaultValue={0}
                    onChange={(v) => updateOptions({ barInset: v || undefined })}
                  />
                  <SliderWithNumber
                    label="Fill opacity (%)"
                    value={options.barFillOpacity != null ? Math.round(options.barFillOpacity * 100) : undefined}
                    min={5} max={100} step={5} defaultValue={100}
                    onChange={(v) => updateOptions({ barFillOpacity: v / 100 })}
                  />
                  <HexColorInput
                    label="Stroke color (outline)"
                    value={options.barStroke}
                    placeholder="#6b7280"
                    onChange={(v) => updateOptions({ barStroke: v })}
                    onClear={() => updateOptions({ barStroke: undefined })}
                  />
                </div>
              )}

              {/* Line stroke style */}
              {(t === "line" || t === "area") && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Line Style</label>
                  <div className="flex gap-1">
                    {(["solid", "dashed", "dotted", "longdash"] as const).map((style) => (
                      <Button
                        key={style}
                        variant={(options.strokeStyle ?? "solid") === style ? "default" : "outline"}
                        size="sm"
                        className="text-xs flex-1 px-1"
                        onClick={() => updateOptions({ strokeStyle: style === "solid" ? undefined : style })}
                      >
                        {style === "solid" ? "—" : style === "dashed" ? "- -" : style === "dotted" ? "···" : "——"}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Line stroke width */}
              {(t === "line" || t === "area") && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Stroke Width — {options.strokeWidth ?? 1.5}
                  </label>
                  <input
                    type="range" min={0.5} max={5} step={0.5}
                    value={options.strokeWidth ?? 1.5}
                    onChange={(e) => updateOptions({ strokeWidth: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              )}

              {/* Scatter dot mode + symbol */}
              {t === "scatter" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Dot Mode</label>
                    <div className="flex gap-1">
                      {(["fill", "stroke", "both"] as const).map((mode) => (
                        <Button
                          key={mode}
                          variant={(options.dotMode ?? "fill") === mode ? "default" : "outline"}
                          size="sm"
                          className="text-xs flex-1"
                          onClick={() => updateOptions({ dotMode: mode === "fill" ? undefined : mode })}
                        >
                          {mode}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Symbol Shape</label>
                    <div className="grid grid-cols-5 gap-1">
                      {(["circle", "square", "triangle", "diamond", "pentagon", "star", "times", "wye", "cross"] as const).map((sym) => (
                        <Button
                          key={sym}
                          variant={(options.dotSymbol ?? "circle") === sym ? "default" : "outline"}
                          size="sm"
                          className="text-[10px] px-1 py-1 h-auto"
                          onClick={() => updateOptions({ dotSymbol: sym === "circle" ? undefined : sym })}
                        >
                          {sym.slice(0, 3)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Opacity (non-bar, non-line — those have their own controls above) */}
              {t !== "bar" && t !== "line" && t !== "area" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Opacity — {(options.opacity ?? 1).toFixed(1)}
                  </label>
                  <input
                    type="range" min={0.1} max={1} step={0.1}
                    value={options.opacity ?? 1}
                    onChange={(e) => updateOptions({ opacity: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              )}

              {/* Tooltip + crosshair */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={options.showTooltip !== false}
                    onChange={(e) => updateOptions({ showTooltip: e.target.checked })}
                  />
                  Show tooltip on hover
                </label>
                {(t === "line" || t === "area") && (
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={options.crosshair ?? false}
                      onChange={(e) => updateOptions({ crosshair: e.target.checked })}
                    />
                    Crosshair guide
                  </label>
                )}
              </div>

              {/* Legend + title */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={options.showLegend !== false}
                    onChange={(e) => updateOptions({ showLegend: e.target.checked })}
                  />
                  Show legend
                </label>
                {options.showLegend !== false && (mapping.color || t === "heatmap") && (
                  <input
                    className="w-full rounded border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Legend title (auto)"
                    value={options.legendTitle ?? ""}
                    onChange={(e) => updateOptions({ legendTitle: e.target.value || undefined })}
                  />
                )}
              </div>

              {/* Color scheme */}
              {t === "heatmap" ? (
                <>
                  <ColorSchemePicker
                    schemes={SEQUENTIAL_SCHEMES}
                    value={options.colorScheme}
                    onChange={(s) => updateOptions({ colorScheme: s })}
                    defaultScheme="ylgnbu"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Color min</label>
                      <input
                        type="number"
                        className="w-full rounded border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                        placeholder="Auto"
                        value={options.colorDomainMin ?? ""}
                        onChange={(e) => updateOptions({ colorDomainMin: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Color max</label>
                      <input
                        type="number"
                        className="w-full rounded border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                        placeholder="Auto"
                        value={options.colorDomainMax ?? ""}
                        onChange={(e) => updateOptions({ colorDomainMax: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Legend tick format</label>
                    <input
                      className="w-full rounded border bg-background px-2 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-ring"
                      placeholder=",.0f"
                      value={options.legendTickFormat ?? ""}
                      onChange={(e) => updateOptions({ legendTickFormat: e.target.value || undefined })}
                    />
                  </div>
                </>
              ) : mapping.color ? (
                <ColorSchemePicker
                  schemes={CATEGORICAL_SCHEMES}
                  value={options.colorScheme}
                  onChange={(s) => updateOptions({ colorScheme: s })}
                />
              ) : null}

              {/* Series-by-series color overrides */}
              {(() => {
                const seriesNames: string[] =
                  Array.isArray(mapping.y) && mapping.y.length > 1
                    ? (mapping.y as string[])
                    : mapping.color && result
                    ? [...new Set(result.rows.map((r) => String((r as Record<string, unknown>)[mapping.color!])))].slice(0, 24)
                    : [];
                if (seriesNames.length === 0) return null;
                return (
                  <CollapsibleSection title="Per-Series Colors">
                    <div className="space-y-2">
                      {seriesNames.map((name) => (
                        <HexColorInput
                          key={name}
                          label={name}
                          value={(options.seriesColors ?? {})[name]}
                          onChange={(v) =>
                            updateOptions({
                              seriesColors: { ...(options.seriesColors ?? {}), [name]: v },
                            })
                          }
                          onClear={() => {
                            const next = { ...(options.seriesColors ?? {}) };
                            delete next[name];
                            updateOptions({ seriesColors: Object.keys(next).length ? next : undefined });
                          }}
                        />
                      ))}
                      {Object.keys(options.seriesColors ?? {}).length > 0 && (
                        <button
                          className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                          onClick={() => updateOptions({ seriesColors: undefined })}
                        >
                          Clear all overrides
                        </button>
                      )}
                    </div>
                  </CollapsibleSection>
                );
              })()}
            </div>
          )}

          {/* ── Axes tab ── */}
          {configTab === "axes" && (
            <div className="space-y-4 p-3">
              {/* Axis labels */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">X Label</label>
                  <input
                    className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Auto"
                    value={options.xLabel ?? ""}
                    onChange={(e) => updateOptions({ xLabel: e.target.value || undefined })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Y Label</label>
                  <input
                    className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Auto"
                    value={options.yLabel ?? ""}
                    onChange={(e) => updateOptions({ yLabel: e.target.value || undefined })}
                  />
                </div>
              </div>

              {/* Axis font size */}
              <SliderWithNumber
                label="Tick font size (px)"
                value={options.axisFontSize}
                min={8} max={18} step={1} defaultValue={11}
                onChange={(v) => updateOptions({ axisFontSize: v === 11 ? undefined : v })}
              />

              {/* ── Tick format: X ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">X Axis Format</label>
                <div className="flex flex-wrap gap-1">
                  {([
                    { label: "Auto", value: "auto" },
                    { label: "1,234", value: "integer" },
                    { label: "1,234.56", value: "number" },
                    { label: "45%", value: "percent" },
                    { label: "$1,234", value: "currency" },
                    { label: "1.2M", value: "compact" },
                    { label: "Jan 2024", value: "date-month" },
                    { label: "2024", value: "date-year" },
                  ] as const).map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => {
                        const fmt: Record<string, string> = {
                          integer: ",.0f", number: ",.2f", percent: ".0%",
                          currency: "$,.0f", compact: "~s",
                          "date-month": "%b %Y", "date-year": "%Y",
                        };
                        updateOptions({
                          xDataType: value,
                          xTickFormat: value === "auto" ? undefined : fmt[value],
                        });
                      }}
                      style={{
                        fontSize: 10, padding: "2px 7px", border: "1px solid",
                        borderColor: (options.xDataType ?? "auto") === value
                          ? "var(--color-text-primary)" : "var(--color-border-tertiary)",
                        background: (options.xDataType ?? "auto") === value
                          ? "var(--color-background-secondary)" : "transparent",
                        color: (options.xDataType ?? "auto") === value
                          ? "var(--color-text-primary)" : "var(--color-muted-foreground)",
                        borderRadius: 4, cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  className="w-full rounded border bg-background px-2 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Custom: %b %Y  or  $,.2f"
                  value={options.xTickFormat ?? ""}
                  onChange={(e) => updateOptions({ xTickFormat: e.target.value || undefined, xDataType: e.target.value ? undefined : options.xDataType })}
                />
              </div>

              {/* ── Tick format: Y ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Y Axis Format</label>
                <div className="flex flex-wrap gap-1">
                  {([
                    { label: "Auto", value: "auto" },
                    { label: "1,234", value: "integer" },
                    { label: "1,234.56", value: "number" },
                    { label: "45%", value: "percent" },
                    { label: "$1,234", value: "currency" },
                    { label: "1.2M", value: "compact" },
                    { label: "Jan 2024", value: "date-month" },
                    { label: "2024", value: "date-year" },
                  ] as const).map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => {
                        const fmt: Record<string, string> = {
                          integer: ",.0f", number: ",.2f", percent: ".0%",
                          currency: "$,.0f", compact: "~s",
                          "date-month": "%b %Y", "date-year": "%Y",
                        };
                        updateOptions({
                          yDataType: value,
                          yTickFormat: value === "auto" ? undefined : fmt[value],
                        });
                      }}
                      style={{
                        fontSize: 10, padding: "2px 7px", border: "1px solid",
                        borderColor: (options.yDataType ?? "auto") === value
                          ? "var(--color-text-primary)" : "var(--color-border-tertiary)",
                        background: (options.yDataType ?? "auto") === value
                          ? "var(--color-background-secondary)" : "transparent",
                        color: (options.yDataType ?? "auto") === value
                          ? "var(--color-text-primary)" : "var(--color-muted-foreground)",
                        borderRadius: 4, cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  className="w-full rounded border bg-background px-2 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Custom: ,.0f  or  $,.2f"
                  value={options.yTickFormat ?? ""}
                  onChange={(e) => updateOptions({ yTickFormat: e.target.value || undefined, yDataType: e.target.value ? undefined : options.yDataType })}
                />
              </div>

              {/* Border / frame */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Borders</label>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={options.xAxisLine ?? false}
                      onChange={(e) => updateOptions({ xAxisLine: e.target.checked || undefined })} />
                    X axis line
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={options.yAxisLine ?? false}
                      onChange={(e) => updateOptions({ yAxisLine: e.target.checked || undefined })} />
                    Y axis line
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={options.chartFrame ?? false}
                      onChange={(e) => updateOptions({ chartFrame: e.target.checked || undefined })} />
                    Full frame (box)
                  </label>
                </div>
              </div>

              {/* Grid controls */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Grid</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={options.xGrid ?? false}
                      onChange={(e) => updateOptions({ xGrid: e.target.checked || undefined })} />
                    X grid
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={options.yGrid ?? false}
                      onChange={(e) => updateOptions({ yGrid: e.target.checked || undefined })} />
                    Y grid
                  </label>
                </div>
                {(options.xGrid || options.yGrid) && (
                  <CollapsibleSection title="Grid style">
                    <div className="space-y-3">
                      {options.xGrid && (
                        <div className="space-y-2">
                          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">X Grid</div>
                          <HexColorInput
                            label="Color"
                            value={options.xGridColor}
                            placeholder="currentColor"
                            onChange={(v) => updateOptions({ xGridColor: v })}
                            onClear={() => updateOptions({ xGridColor: undefined })}
                          />
                          <SliderWithNumber
                            label="Width (px)" value={options.xGridWidth}
                            min={0.5} max={4} step={0.5} defaultValue={1}
                            onChange={(v) => updateOptions({ xGridWidth: v })}
                          />
                          <SliderWithNumber
                            label="Opacity (%)"
                            value={options.xGridOpacity != null ? Math.round(options.xGridOpacity * 100) : undefined}
                            min={5} max={100} step={5} defaultValue={10}
                            onChange={(v) => updateOptions({ xGridOpacity: v / 100 })}
                          />
                          <div className="space-y-0.5">
                            <label className="text-[10px] text-muted-foreground">Tick count (blank = auto)</label>
                            <input
                              type="number" min={1} max={50}
                              className="w-full rounded border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                              placeholder="Auto"
                              value={options.xGridTicks ?? ""}
                              onChange={(e) => updateOptions({ xGridTicks: e.target.value ? Number(e.target.value) : undefined })}
                            />
                          </div>
                        </div>
                      )}
                      {options.yGrid && (
                        <div className="space-y-2">
                          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Y Grid</div>
                          <HexColorInput
                            label="Color"
                            value={options.yGridColor}
                            placeholder="currentColor"
                            onChange={(v) => updateOptions({ yGridColor: v })}
                            onClear={() => updateOptions({ yGridColor: undefined })}
                          />
                          <SliderWithNumber
                            label="Width (px)" value={options.yGridWidth}
                            min={0.5} max={4} step={0.5} defaultValue={1}
                            onChange={(v) => updateOptions({ yGridWidth: v })}
                          />
                          <SliderWithNumber
                            label="Opacity (%)"
                            value={options.yGridOpacity != null ? Math.round(options.yGridOpacity * 100) : undefined}
                            min={5} max={100} step={5} defaultValue={10}
                            onChange={(v) => updateOptions({ yGridOpacity: v / 100 })}
                          />
                          <div className="space-y-0.5">
                            <label className="text-[10px] text-muted-foreground">Tick count (blank = auto)</label>
                            <input
                              type="number" min={1} max={50}
                              className="w-full rounded border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                              placeholder="Auto"
                              value={options.yGridTicks ?? ""}
                              onChange={(e) => updateOptions({ yGridTicks: e.target.value ? Number(e.target.value) : undefined })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>
                )}
              </div>

              {/* Scale types */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">X Scale</label>
                  <select
                    className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                    value={options.xScaleType ?? ""}
                    onChange={(e) => updateOptions({ xScaleType: (e.target.value || undefined) as typeof options.xScaleType })}
                  >
                    <option value="">Auto</option>
                    <option value="linear">Linear</option>
                    <option value="log">Log</option>
                    <option value="sqrt">Sqrt</option>
                    <option value="time">Time</option>
                    <option value="band">Band</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Y Scale</label>
                  <select
                    className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                    value={options.yScaleType ?? ""}
                    onChange={(e) => updateOptions({ yScaleType: (e.target.value || undefined) as typeof options.yScaleType })}
                  >
                    <option value="">Auto</option>
                    <option value="linear">Linear</option>
                    <option value="log">Log</option>
                    <option value="sqrt">Sqrt</option>
                    <option value="time">Time</option>
                  </select>
                </div>
              </div>

              {/* Scale flags */}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={options.yZero ?? false}
                    onChange={(e) => updateOptions({ yZero: e.target.checked })} />
                  Y from zero
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={options.xReverse ?? false}
                    onChange={(e) => updateOptions({ xReverse: e.target.checked })} />
                  Reverse X
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={options.yReverse ?? false}
                    onChange={(e) => updateOptions({ yReverse: e.target.checked })} />
                  Reverse Y
                </label>
              </div>
            </div>
          )}

          {/* ── Transform tab ── */}
          {configTab === "transform" && (
            <div className="space-y-3 p-3">
              {/* Trend line */}
              {(t === "scatter" || t === "line") && (
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={options.showTrendLine ?? false}
                    onChange={(e) => updateOptions({ showTrendLine: e.target.checked })}
                  />
                  Trend line (linear regression)
                </label>
              )}

              {/* Normalize */}
              {(t === "line" || t === "area") && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Normalize Y</label>
                  <select
                    className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                    value={options.normalize ?? ""}
                    onChange={(e) => updateOptions({ normalize: (e.target.value || null) as typeof options.normalize })}
                  >
                    <option value="">None</option>
                    <option value="first">Relative to first</option>
                    <option value="max">Relative to max</option>
                    <option value="sum">% of total</option>
                    <option value="mean">Relative to mean</option>
                  </select>
                </div>
              )}

              {/* Rolling average */}
              {(t === "line" || t === "area") && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Rolling Average — {options.windowSize ? `${options.windowSize} pts` : "Off"}
                  </label>
                  <input
                    type="range" min={1} max={50} step={1}
                    value={options.windowSize ?? 1}
                    onChange={(e) => updateOptions({ windowSize: Number(e.target.value) <= 1 ? undefined : Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              )}

              {!(t === "scatter" || t === "line" || t === "area") && (
                <p className="text-xs text-muted-foreground opacity-60">
                  No transform options for this chart type.
                </p>
              )}
            </div>
          )}

          {/* ── Advanced tab ── */}
          {configTab === "advanced" && (
            <div className="space-y-3 p-3">
              {/* Margins */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Margins (px)</label>
                <div className="grid grid-cols-4 gap-1">
                  {([
                    { key: "marginTop", label: "Top", placeholder: "20" },
                    { key: "marginRight", label: "Right", placeholder: "20" },
                    { key: "marginBottom", label: "Bot", placeholder: "40" },
                    { key: "marginLeft", label: "Left", placeholder: "60" },
                  ] as const).map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-0.5">
                      <label className="text-[10px] text-muted-foreground">{label}</label>
                      <input
                        type="number" min={0} max={120}
                        className="w-full rounded border bg-background px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                        placeholder={placeholder}
                        value={options[key] ?? ""}
                        onChange={(e) => updateOptions({ [key]: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Reference lines */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Reference Lines</label>
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
                    >×</button>
                  </div>
                ))}
                <button
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => updateOptions({ referenceLines: [...(options.referenceLines ?? []), { axis: "y", value: 0 }] })}
                >
                  + Add reference line
                </button>
              </div>

              {/* Faceting */}
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
            </div>
          )}
        </div>
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

      {/* ═══ Type selector — at the bottom as a scrollable list ═══ */}
      <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 4 }}>
        <div style={{ fontSize: 10, fontWeight: 500, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "6px 12px 4px" }}>
          Chart Type
        </div>
        <div style={{ maxHeight: 220, overflowY: "auto" }}>
          {[
            { group: "Charts", types: ["bar", "line", "area", "scatter", "histogram", "box", "heatmap", "waffle", "combo", "pie", "funnel", "treemap", "tree", "density", "difference", "flow", "network"] },
            { group: "Tables", types: ["table", "grouped-table", "crosstab"] },
            { group: "Content", types: ["kpi", "markdown", "html", "image", "embed", "custom", "vega-lite", "nav-bar"] },
          ].map(({ group, types }) => (
            <div key={group}>
              <div style={{ fontSize: 9, fontWeight: 600, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 12px 2px" }}>
                {group}
              </div>
              {types.map((type) => {
                const entry = VIZ_TYPES.find((v) => v.type === type);
                if (!entry) return null;
                const { icon: Icon, label } = entry;
                const active = t === type;
                return (
                  <button
                    key={type}
                    onClick={() => onChangeType(type as typeof t)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "5px 12px",
                      border: "none",
                      background: active ? "var(--color-background-secondary)" : "transparent",
                      color: active ? "var(--color-text-primary)" : "var(--color-muted-foreground)",
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: active ? 500 : 400,
                      textAlign: "left",
                    }}
                  >
                    <Icon size={12} style={{ flexShrink: 0, color: active ? "var(--color-text-primary)" : "var(--color-muted-foreground)" }} />
                    {label}
                    {active && (
                      <span style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "var(--color-primary)", flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

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
