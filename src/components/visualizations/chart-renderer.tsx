import type { QueryResult } from "@/engine/types";
import type { VisualizationConfig } from "@/types/dashboard";
import { PlotChart } from "./plot-chart";
import { PieChart } from "./pie-chart";
import { KpiCard } from "./kpi-card";
import { DataTable } from "./data-table";

interface ChartRendererProps {
  result: QueryResult;
  config: VisualizationConfig;
}

export function ChartRenderer({ result, config }: ChartRendererProps) {
  if (result.rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        No data to display
      </div>
    );
  }

  switch (config.type) {
    case "bar":
    case "line":
    case "area":
    case "scatter":
    case "histogram":
    case "box":
    case "heatmap":
    case "waffle":
      return (
        <PlotChart
          type={config.type}
          result={result}
          mapping={config.mapping}
          options={config.options}
        />
      );

    case "pie":
      return <PieChart result={result} mapping={config.mapping} />;

    case "kpi":
      return (
        <KpiCard
          result={result}
          mapping={config.mapping}
          options={config.options}
        />
      );

    case "table":
      return <DataTable result={result} options={config.options} />;

    default:
      return (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Unknown visualization type
        </div>
      );
  }
}
