import {
  BarChart3,
  LineChart,
  AreaChart,
  ScatterChart,
  PieChart,
  Table2,
  Hash,
} from "lucide-react";
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

export function VizConfigPanel({
  config,
  result,
  onChangeType,
  onChangeMapping,
  onChangeOptions,
}: VizConfigPanelProps) {
  const columns = result?.columns.map((c) => c.name) ?? [];
  const { mapping, options } = config;

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

          {(config.type === "bar" ||
            config.type === "line" ||
            config.type === "area" ||
            config.type === "scatter") && (
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
    </div>
  );
}
