import type { QueryResult } from "@/engine/types";
import type { ColumnMapping, VisualizationOptions } from "@/types/dashboard";

interface KpiCardProps {
  result: QueryResult;
  mapping: ColumnMapping;
  options: VisualizationOptions;
}

export function KpiCard({ result, mapping, options }: KpiCardProps) {
  if (!mapping.value || result.rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Configure a value column
      </div>
    );
  }

  const rawValue = result.rows[0][mapping.value];
  const numValue = Number(rawValue);
  const displayValue = Number.isFinite(numValue)
    ? numValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : String(rawValue ?? "—");

  const { prefix, suffix, comparisonValue } = options;

  let comparison: { label: string; positive: boolean } | null = null;
  if (comparisonValue != null && Number.isFinite(numValue) && comparisonValue !== 0) {
    const pct = ((numValue - comparisonValue) / Math.abs(comparisonValue)) * 100;
    comparison = {
      label: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
      positive: pct >= 0,
    };
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1">
      <span className="text-3xl font-bold tabular-nums">
        {prefix ?? ""}
        {displayValue}
        {suffix ?? ""}
      </span>
      {comparison && (
        <span
          className={`text-sm font-medium ${comparison.positive ? "text-green-600" : "text-red-600"}`}
        >
          {comparison.label}
        </span>
      )}
      {mapping.label && result.rows[0][mapping.label] != null && (
        <span className="text-xs text-muted-foreground">
          {String(result.rows[0][mapping.label])}
        </span>
      )}
    </div>
  );
}
