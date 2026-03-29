export interface Dashboard {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  panels: Panel[];
  layout: LayoutItem[];
  filters: DashboardFilter[];
  settings: DashboardSettings;
}

export interface DashboardSettings {
  refreshInterval: number | null;
  defaultDataSourceId: string | null;
}

export type DashboardFilterType = "select" | "date-range" | "text";

export interface DashboardFilter {
  id: string;
  name: string;
  type: DashboardFilterType;
  /** Column name used to populate options (for select type) */
  column?: string;
  /** Table name to query for options */
  table?: string;
  /** Default value */
  defaultValue?: string;
}

export interface Panel {
  id: string;
  title: string;
  query: PanelQuery;
  visualization: VisualizationConfig;
  /** Whether {{filter}} placeholders are interpolated. Defaults to true. */
  applyDashboardFilters?: boolean;
}

export interface PanelQuery {
  sql: string;
  dataSourceId: string | null;
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export type VisualizationType =
  | "bar"
  | "line"
  | "area"
  | "scatter"
  | "histogram"
  | "box"
  | "heatmap"
  | "waffle"
  | "pie"
  | "table"
  | "kpi"
  | "tree"
  | "density"
  | "difference"
  | "flow"
  | "funnel"
  | "treemap";

export interface VisualizationConfig {
  type: VisualizationType;
  mapping: ColumnMapping;
  options: VisualizationOptions;
}

export interface ColumnMapping {
  x?: string;
  y?: string | string[];
  color?: string;
  size?: string;
  label?: string;
  value?: string;
  category?: string;
  /** Facet horizontal (small multiples by column) */
  fx?: string;
  /** Facet vertical (small multiples by column) */
  fy?: string;
  /** Delimiter-separated path column (tree, treemap) */
  path?: string;
  /** First Y column for difference chart */
  y1?: string;
  /** Second Y column for difference chart */
  y2?: string;
  /** Source X for flow/arrow */
  x1?: string;
  /** Source Y for flow/arrow */
  y1Flow?: string;
  /** Target X for flow/arrow */
  x2?: string;
  /** Target Y for flow/arrow */
  y2Flow?: string;
}

export interface VisualizationOptions {
  stacked?: boolean;
  horizontal?: boolean;
  curve?: "linear" | "step" | "natural";
  prefix?: string;
  suffix?: string;
  comparisonValue?: number;
  pageSize?: number;
  colorScheme?: string;
  showLegend?: boolean;
  /** Tooltip on hover (default: true) */
  showTooltip?: boolean;
  /** Crosshair follows pointer — best for line/area (default: false) */
  crosshair?: boolean;
  /** Axis labels */
  xLabel?: string;
  yLabel?: string;
  /** Grid lines */
  xGrid?: boolean;
  yGrid?: boolean;
  /** Histogram bin count */
  thresholds?: number;
  /** Show linear regression trend line (scatter/line) */
  showTrendLine?: boolean;
  /** Normalize Y values (line/area): basis for normalization */
  normalize?: "first" | "last" | "max" | "sum" | "mean" | null;
  /** Rolling window size for smoothing (line/area) */
  windowSize?: number;
  /** Rolling window reducer */
  windowReduce?: "mean" | "median" | "min" | "max" | "sum";
  /** Scale config */
  xScaleType?: "linear" | "log" | "sqrt" | "time" | "band" | "point";
  yScaleType?: "linear" | "log" | "sqrt" | "time" | "band" | "point";
  yZero?: boolean;
  yNice?: boolean;
  xReverse?: boolean;
  yReverse?: boolean;
  /** Mark fill/stroke opacity */
  opacity?: number;
  /** Line/area stroke width */
  strokeWidth?: number;
  /** Reference lines */
  referenceLines?: Array<{
    axis: "x" | "y";
    value: number;
    label?: string;
  }>;
  /** Tree layout style */
  treeLayout?: "tidy" | "cluster";
  /** Tree path delimiter */
  treeDelimiter?: string;
  /** Density bandwidth */
  densityBandwidth?: number;
  /** Density contour thresholds */
  densityThresholds?: number;
  /** Show point overlay on density plot */
  densityShowPoints?: boolean;
  /** Positive fill color for difference chart */
  positiveFill?: string;
  /** Negative fill color for difference chart */
  negativeFill?: string;
  /** Flow arrow bend angle */
  flowBend?: number;
  /** Funnel: show percentage labels */
  funnelShowPercentage?: boolean;
  /** Funnel: show step-over-step conversion rates */
  funnelShowConversion?: boolean;
  /** Treemap tiling algorithm */
  treemapTiling?: "squarify" | "binary" | "slice" | "dice";
  /** Treemap inner padding */
  treemapPadding?: number;
}
