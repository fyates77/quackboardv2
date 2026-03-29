import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Column Select ──────────────────────────────────────────── */

export function ColumnSelect({
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

/* ─── Multi Column Select ────────────────────────────────────── */

export function MultiColumnSelect({
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

/* ─── Collapsible Section ────────────────────────────────────── */

export function CollapsibleSection({
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

/* ─── Color Scheme Picker ────────────────────────────────────── */

export interface SchemeOption {
  name: string;
  label: string;
  colors: string[];
}

export const CATEGORICAL_SCHEMES: SchemeOption[] = [
  { name: "accent", label: "Accent", colors: ["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0"] },
  { name: "category10", label: "Category 10", colors: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"] },
  { name: "dark2", label: "Dark 2", colors: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e"] },
  { name: "paired", label: "Paired", colors: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99"] },
  { name: "set1", label: "Set 1", colors: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"] },
  { name: "set2", label: "Set 2", colors: ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854"] },
  { name: "tableau10", label: "Tableau 10", colors: ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f"] },
  { name: "observable10", label: "Observable", colors: ["#4269d0", "#efb118", "#ff725c", "#6cc5b0", "#3ca951"] },
];

export const SEQUENTIAL_SCHEMES: SchemeOption[] = [
  { name: "ylgnbu", label: "YlGnBu", colors: ["#ffffd9", "#c7e9b4", "#41b6c4", "#225ea8", "#081d58"] },
  { name: "viridis", label: "Viridis", colors: ["#440154", "#31688e", "#35b779", "#90d743", "#fde725"] },
  { name: "blues", label: "Blues", colors: ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"] },
  { name: "reds", label: "Reds", colors: ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"] },
  { name: "oranges", label: "Oranges", colors: ["#feedde", "#fdbe85", "#fd8d3c", "#e6550d", "#a63603"] },
  { name: "turbo", label: "Turbo", colors: ["#23171b", "#4076f5", "#2db94d", "#faba39", "#900c00"] },
  { name: "warm", label: "Warm", colors: ["#6e40aa", "#bf3caf", "#fe4b83", "#ff7847", "#e2b72f"] },
  { name: "cool", label: "Cool", colors: ["#6e40aa", "#4c6edb", "#23abd8", "#4cc8a3", "#aff05b"] },
];

export function ColorSchemePicker({
  schemes,
  value,
  onChange,
  defaultScheme,
}: {
  schemes: SchemeOption[];
  value: string | undefined;
  onChange: (scheme: string | undefined) => void;
  defaultScheme?: string;
}) {
  const activeScheme = value ?? defaultScheme;
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        Color Scheme
      </label>
      <div className="grid grid-cols-2 gap-1.5">
        {schemes.map((scheme) => (
          <button
            key={scheme.name}
            className={cn(
              "flex flex-col gap-1 rounded border px-2 py-1.5 text-left transition-colors",
              activeScheme === scheme.name
                ? "border-primary bg-primary/10"
                : "border-input hover:bg-accent",
            )}
            onClick={() => onChange(scheme.name)}
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
      {value && !defaultScheme && (
        <button
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onChange(undefined)}
        >
          Reset to default
        </button>
      )}
    </div>
  );
}
