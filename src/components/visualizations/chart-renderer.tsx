import type { QueryResult } from "@/engine/types";
import type { Panel, VisualizationConfig } from "@/types/dashboard";
import { PlotChart } from "./plot-chart";
import { PieChart } from "./pie-chart";
import { KpiCard } from "./kpi-card";
import { DataTable } from "./data-table";
import { FunnelChart } from "./funnel-chart";
import { TreemapChart } from "./treemap-chart";
import { NetworkChart } from "./network-chart";
import { CustomVizPanel } from "./custom-viz-panel";
import { GroupedTable } from "./grouped-table";
import { CrosstabTable } from "./crosstab";
import { MarkdownPanel } from "./markdown-panel";
import { ImagePanel } from "./image-panel";
import { EmbedPanel } from "./embed-panel";
import { HtmlPanel } from "./html-panel";
import { NavBarPanel } from "./nav-bar-panel";
import { VegaLitePanel } from "./vega-lite-panel";

export interface ClickDatum {
  column: string;
  value: unknown;
}

interface ChartRendererProps {
  result: QueryResult;
  config: VisualizationConfig;
  /** Full panel for content panel types that read markdownContent etc. */
  panel?: Panel;
  /** All panel results for template variable resolution in markdown/html */
  allResults?: Map<string, QueryResult>;
  /** Callback when a datum is clicked in a chart */
  onClickDatum?: (datum: ClickDatum) => void;
  /** Dashboard ID — required for nav-bar panels to read/write active tab */
  dashboardId?: string;
}

export function ChartRenderer({ result, config, panel, allResults, onClickDatum, dashboardId }: ChartRendererProps) {
  // Content panel types don't need query results
  if (config.type === "markdown") {
    return (
      <MarkdownPanel
        content={panel?.markdownContent ?? ""}
        panelResults={allResults}
      />
    );
  }

  if (config.type === "image") {
    return (
      <ImagePanel
        url={panel?.imageUrl ?? ""}
      />
    );
  }

  if (config.type === "embed") {
    return (
      <EmbedPanel
        url={panel?.embedUrl ?? ""}
      />
    );
  }

  if (config.type === "html") {
    return (
      <HtmlPanel
        content={panel?.htmlContent ?? ""}
        panelResults={allResults}
      />
    );
  }

  if (config.type === "nav-bar") {
    const navCfg = config.options.navBarConfig ?? {
      orientation: "horizontal" as const,
      items: [],
    };
    return (
      <NavBarPanel
        config={navCfg}
        dashboardId={dashboardId ?? ""}
      />
    );
  }

  if (config.type === "custom") {
    return (
      <CustomVizPanel
        result={result}
        code={panel?.customVizCode ?? ""}
      />
    );
  }

  if (config.type === "vega-lite") {
    return (
      <VegaLitePanel
        spec={config.options.vegaLiteSpec ?? "{}"}
        result={result}
      />
    );
  }

  // Data-driven panel types need results
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
    case "combo":
    case "tree":
    case "density":
    case "difference":
    case "flow":
      return (
        <PlotChart
          type={config.type}
          result={result}
          mapping={config.mapping}
          options={config.options}
          annotations={panel?.annotations}
          onClickDatum={onClickDatum}
        />
      );

    case "pie":
      return <PieChart result={result} mapping={config.mapping} onClickDatum={onClickDatum} />;

    case "funnel":
      return (
        <FunnelChart
          result={result}
          mapping={config.mapping}
          options={config.options}
          onClickDatum={onClickDatum}
        />
      );

    case "treemap":
      return (
        <TreemapChart
          result={result}
          mapping={config.mapping}
          options={config.options}
          onClickDatum={onClickDatum}
        />
      );

    case "network":
      return (
        <NetworkChart
          result={result}
          mapping={config.mapping}
          options={config.options}
          onClickDatum={onClickDatum}
        />
      );

    case "kpi":
      return (
        <KpiCard
          result={result}
          mapping={config.mapping}
          options={config.options}
        />
      );

    case "table":
      return <DataTable result={result} options={config.options} onClickDatum={onClickDatum} />;

    case "grouped-table":
      return <GroupedTable result={result} options={config.options} onClickDatum={onClickDatum} />;

    case "crosstab":
      return <CrosstabTable result={result} options={config.options} onClickDatum={onClickDatum} />;

    default:
      return (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Unknown visualization type
        </div>
      );
  }
}
