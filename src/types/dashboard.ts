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
  | "pie"
  | "table"
  | "kpi";

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
}
