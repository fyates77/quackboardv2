import {
  BarChart3,
  LineChart,
  AreaChart,
  ScatterChart,
  PieChart,
  Table2,
  Hash,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QueryResult } from "@/engine/types";
import type {
  VisualizationType,
  VisualizationConfig,
  ColumnMapping,
  VisualizationOptions,
} from "@/types/dashboard";

interface VizConfigPanelProps {
  config: VisualizationConfig;
  result: QueryResult | null;
  onChangeType: (type: VisualizationType) => void;
  onChangeMapping: (mapping: ColumnMapping) => void;
  onChangeOptions: (options: VisualizationOptions) => void;
}

const VIZ_TYPES: { type: VisualizationType; label: string; icon: typeof BarChart3 }[] = [
  { type: "bar", label: "Bar", icon: BarChart3 },
  { type: "line", label: "Line", icon: LineChart },
  { type: "area", label: "Area", icon: AreaChart },
  { type: "scatter", label: "Scatter", icon: ScatterChart },
  { type: "pie", label: "Pie", icon: PieChart },
  { type: "table", label: "Table", icon: Table2 },
  { type: "kpi", label: "KPI", icon: Hash },
];

const COLOR_SCHEMES = [
  { name: "accent", label: "Accent", colors: ["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0"] },
  { name: "category10", label: "Category 10", colors: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"] },
  { name: "dark2", label: "Dark 2", colors: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e"] },
  { name: "paired", label: "Paired", colors: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99"] },
  { name: "set1", label: "Set 1", colors: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"] },
  { name: "set2", label: "Set 2", colors: ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854"] },
  { name: "tableau10", label: "Tableau 10", colors: ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f"] },
  { name: "observable10", label: "Observable", colors: ["#4269d0", "#efb118", "#ff725c", "#6cc5b0", "#3ca951"] },
];

function ColumnSelect({
  label,
  value,
  columns,
  onChange,
  allowNone,
}: {
  label: string;
  value: string | undefined;
  columns: string[];
  onChange: (val: string | undefined) => void;
  allowNone?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select
        className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        {allowNone !== false && <option value="">None</option>}
        {columns.map((col) => (
          <option key={col} value={col}>
            {col}
          </option>
        ))}
      </select>
    </div>
  );
}

function MultiColumnSelect({
  label,
  value,
  columns,
  onChange,
}: {
  label: string;
  value: string | string[] | undefined;
  columns: string[];
  onChange: (val: string | string[] | undefined) => void;
}) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  const toggle = (col: string) => {
    const next = selected.includes(col)
      ? selected.filter((c) => c !== col)
      : [...selected, col];
    onChange(next.length === 0 ? undefined : next.length === 1 ? next[0] : next);
  };

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex flex-wrap gap-1">
        {columns.map((col) => (
          <button
            key={col}
            className={cn(
              "rounded border px-2 py-0.5 text-xs transition-colors",
              selected.includes(col)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:bg-accent",
            )}
            onClick={() => toggle(col)}
          >
            {col}
          </button>
        ))}
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        className="flex w-full items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {title}
      </button>
      {open && <div className="mt-2 space-y-3">{children}</div>}
    </div>
  );
}

export function VizConfigPanel({
  config,
  result,
  onChangeType,
  onChangeMapping,
  onChangeOptions,
}: VizConfigPanelProps) {
  const columns = result?.columns.map((c) => c.name) ?? [];
  const { mapping, options } = config;

  const isPlotChart =
    config.type === "bar" ||
    config.type === "line" ||
    config.type === "area" ||
    config.type === "scatter";

  const updateMapping = (patch: Partial<ColumnMapping>) => {
    onChangeMapping({ ...mapping, ...patch });
  };

  const updateOptions = (patch: Partial<VisualizationOptions>) => {
    onChangeOptions({ ...options, ...patch });
  };

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Chart Type
        </label>
        <div className="grid grid-cols-4 gap-1">
          {VIZ_TYPES.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant={config.type === type ? "default" : "outline"}
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

      {/* Column mappings -- vary by chart type */}
      {columns.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground">
            Column Mapping
          </div>

          {isPlotChart && (
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
              {config.type === "scatter" && (
                <ColumnSelect
                  label="Size"
                  value={mapping.size}
                  columns={columns}
                  onChange={(size) => updateMapping({ size })}
                />
              )}
            </>
          )}

          {config.type === "pie" && (
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

          {config.type === "kpi" && (
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

      {/* Type-specific options */}
      {config.type === "bar" && columns.length > 0 && (
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
            Horizontal bars
          </label>
        </div>
      )}

      {(config.type === "line" || config.type === "area") &&
        columns.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Curve
            </div>
            <div className="flex gap-1">
              {(["linear", "step", "natural"] as const).map((curve) => (
                <Button
                  key={curve}
                  variant={
                    (options.curve ?? "linear") === curve
                      ? "default"
                      : "outline"
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

      {/* Customize section — tooltips, crosshair, color scheme */}
      {isPlotChart && columns.length > 0 && (
        <CollapsibleSection title="Customize">
          {/* Tooltip toggle */}
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

          {/* Crosshair toggle (line/area only) */}
          {(config.type === "line" || config.type === "area") && (
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

          {/* Legend toggle */}
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

          {/* Color scheme picker */}
          {mapping.color && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Color Scheme
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {COLOR_SCHEMES.map((scheme) => (
                  <button
                    key={scheme.name}
                    className={cn(
                      "flex flex-col gap-1 rounded border px-2 py-1.5 text-left transition-colors",
                      options.colorScheme === scheme.name
                        ? "border-primary bg-primary/10"
                        : "border-input hover:bg-accent",
                    )}
                    onClick={() => updateOptions({ colorScheme: scheme.name })}
                  >
                    <span className="text-[10px] leading-none">{scheme.label}</span>
                    <div className="flex gap-0.5">
                      {scheme.colors.map((c, i) => (
                        <div
                          key={i}
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              {options.colorScheme && (
                <button
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => updateOptions({ colorScheme: undefined })}
                >
                  Reset to default
                </button>
              )}
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* Axis & Grid section */}
      {isPlotChart && columns.length > 0 && (
        <CollapsibleSection title="Axes & Grid">
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
        </CollapsibleSection>
      )}
    </div>
  );
}
