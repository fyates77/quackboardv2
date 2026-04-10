export interface CanvasPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

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
  /** Named tabs for grouping panels */
  tabs?: DashboardTab[];
  /** Layout mode: grid (default) or vertical scroll */
  layoutMode?: "grid" | "scroll";
  /** Dashboard-level parameters (what-if inputs) */
  parameters?: DashboardParameter[];
  /** Dashboard-level visual theme overrides */
  theme?: DashboardTheme;
  /** Site header shown in consumer view */
  siteHeader?: SiteHeader;
  /** Absolute pixel positions for canvas editor mode */
  canvasPositions?: Record<string, CanvasPosition>;
  /** Page frame width in px for canvas editor (default 1200) */
  pageWidth?: number;
}

export interface SiteHeader {
  /** Page title — defaults to dashboard.name */
  title?: string;
  subtitle?: string;
  /** Logo image URL */
  logoUrl?: string;
  logoAlt?: string;
  /** CSS color or gradient for header background */
  background?: string;
  /** CSS color for header text */
  textColor?: string;
  /** Navigation links */
  links?: Array<{ label: string; dashboardId?: string; url?: string }>;
  /** Show "Last updated: X" timestamp */
  showTimestamp?: boolean;
}

export interface DashboardSettings {
  refreshInterval: number | null;
  defaultDataSourceId: string | null;
}

export interface DashboardTab {
  id: string;
  label: string;
  panelIds: string[];
}

export type ParameterType = "number" | "text" | "select" | "toggle";

export interface DashboardParameter {
  id: string;
  name: string;
  label: string;
  type: ParameterType;
  default: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
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
  /** Drilldown column hierarchy (e.g. ["region", "state", "city"]) */
  drilldownLevels?: string[];
  /** Navigate to another dashboard on click */
  drilldownTarget?: {
    dashboardId: string;
    filterMapping: Record<string, string>;
  };
  /** Allow consumers to see underlying data rows */
  showDataDrawer?: boolean;
  /** Allow consumers to see the SQL query */
  showQueryToConsumer?: boolean;
  /** Fields to show in record detail view (all if omitted) */
  recordFields?: string[];
  /** Markdown content (for markdown panel type) */
  markdownContent?: string;
  /** HTML content (for html panel type) */
  htmlContent?: string;
  /** Image URL (for image panel type) */
  imageUrl?: string;
  /** Embed URL (for embed panel type) */
  embedUrl?: string;
  /** User-authored D3/JS visualization code (for custom viz type) */
  customVizCode?: string;
  /** Visibility condition */
  visibilityCondition?: VisibilityCondition;
  /** Annotations pinned to data points */
  annotations?: PanelAnnotation[];
  /** Action buttons shown on panel chrome */
  actions?: PanelAction[];
  /** Per-panel visual style overrides */
  style?: PanelStyle;
  /** Force panel to span the full canvas width */
  fullWidth?: boolean;
  /** Enable cross-filtering: clicking this panel's chart pushes filter values */
  crossFilterEnabled?: boolean;
  /** Columns this panel listens to for cross-filter values (empty = all) */
  crossFilterListenColumns?: string[];
}

export interface VisibilityCondition {
  type: "query" | "filter" | "always";
  /** For "filter" type: filter name that must have a value */
  filterName?: string;
  /** For "query" type: visible when panel's own query returns rows */
  /** For "always": always visible (default behavior) */
}

export interface PanelAnnotation {
  id: string;
  text: string;
  x?: unknown;
  y?: unknown;
  createdAt: string;
}

export interface PanelAction {
  label: string;
  type: "export-png" | "export-csv" | "copy" | "link";
  url?: string;
}

export interface PanelStyle {
  /** Background: solid CSS color or gradient string */
  background?: string;
  /** Background opacity (0-1) */
  backgroundOpacity?: number;
  /** Border color (CSS color) */
  borderColor?: string;
  /** Border width in px */
  borderWidth?: number;
  /** Border radius in px */
  borderRadius?: number;
  /** Inner padding in px */
  padding?: number;
  /** Shadow preset */
  shadow?: "none" | "sm" | "md" | "lg";
  /** Hide the title bar / panel chrome entirely */
  chromeless?: boolean;
  /** Title alignment */
  titleAlign?: "left" | "center" | "right";
  /** Title font size in px */
  titleSize?: number;
}

export interface DashboardTheme {
  /** Primary/accent color override (CSS color) */
  accentColor?: string;
  /** Font family for the dashboard canvas */
  fontFamily?: string;
  /** Canvas background: color, gradient, or image URL */
  canvasBackground?: string;
  /** Grid spacing multiplier (0.5=compact, 1=normal, 2=spacious) */
  spacingMultiplier?: number;
  /** Custom CSS scoped to the dashboard container */
  customCSS?: string;
}

export interface ThresholdRule {
  operator: "gt" | "lt" | "gte" | "lte" | "between";
  value: number;
  value2?: number;
  /** Text/icon color when rule matches */
  color: string;
  /** Background color when rule matches */
  bgColor?: string;
  /** Optional label (e.g. "Good", "Critical") */
  label?: string;
}

export interface PanelQuery {
  sql: string;
  dataSourceId: string | null;
  /** "builder" = SQL is generated from builderConfig; "sql" = user owns SQL directly */
  mode?: "builder" | "sql";
  builderConfig?: import("./builder").BuilderConfig;
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
  | "grouped-table"
  | "crosstab"
  | "kpi"
  | "combo"
  | "tree"
  | "density"
  | "difference"
  | "flow"
  | "funnel"
  | "treemap"
  | "network"
  | "custom"
  | "markdown"
  | "image"
  | "embed"
  | "html"
  | "nav-bar";

// ─── Nav Bar Panel ─────────────────────────────────────────────────────────

export type NavBarItemType = "tab" | "url" | "divider" | "label";

export interface NavBarItem {
  id: string;
  label: string;
  type: NavBarItemType;
  /** Tab ID to activate (for type "tab") */
  tabId?: string;
  /** URL to navigate to (for type "url") */
  url?: string;
  /** Open URL in new tab */
  openInNew?: boolean;
  /** Lucide icon name from the supported set */
  icon?: NavBarIcon;
  /** Sub-items rendered as a dropdown (horizontal) or nested section (vertical) */
  children?: NavBarItem[];
}

export type NavBarIcon =
  | "home"
  | "bar-chart"
  | "table"
  | "settings"
  | "star"
  | "info"
  | "file"
  | "users"
  | "arrow-right"
  | "layout-dashboard"
  | "database"
  | "layers"
  | "globe"
  | "mail"
  | "bell"
  | "search"
  | "bookmark"
  | "tag"
  | "folder"
  | "calendar"
  | "clock"
  | "map"
  | "trending-up"
  | "trending-down"
  | "activity"
  | "alert-triangle"
  | "check-circle"
  | "x-circle"
  | "link";

export interface NavBarConfig {
  /** Render items in a horizontal row or vertical column */
  orientation: "horizontal" | "vertical";
  items: NavBarItem[];

  // ── Brand slot (optional logo + text left of items) ──────────────
  brandLabel?: string;
  brandLogoUrl?: string;
  brandLogoSize?: number;        // px, default 24

  // ── Item visual style ─────────────────────────────────────────────
  /** plain = no chrome; pill = filled rounded bg; underline = bottom border; bordered = outline border */
  itemStyle?: "plain" | "pill" | "underline" | "bordered";

  // ── Horizontal alignment ──────────────────────────────────────────
  alignment?: "left" | "center" | "right" | "space-between";

  // ── Colors ────────────────────────────────────────────────────────
  /** Nav bar background (CSS color or gradient) */
  background?: string;
  /** Default item text color */
  textColor?: string;
  /** Active item text color */
  activeTextColor?: string;
  /** Active item background (pill/bordered styles) */
  activeBgColor?: string;
  /** Item hover background */
  hoverBgColor?: string;
  /** Divider / separator color */
  dividerColor?: string;

  // ── Typography ────────────────────────────────────────────────────
  fontSize?: number;             // px, default 13
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  uppercase?: boolean;           // letter-spacing uppercase labels
  letterSpacing?: number;        // em units (e.g. 0.08)

  // ── Spacing ───────────────────────────────────────────────────────
  itemPaddingX?: number;         // px, default 12
  itemPaddingY?: number;         // px, default 6
  gap?: number;                  // px gap between top-level items, default 2
  /** Border radius in px for pill/bordered item styles */
  borderRadius?: number;

  // ── Outer frame ───────────────────────────────────────────────────
  showOuterBorder?: boolean;
  outerBorderColor?: string;
  /** Vertical dividers between items (horizontal mode) */
  showDividers?: boolean;

  // ── Vertical sidebar specifics ────────────────────────────────────
  /** Allow sections with children to collapse */
  sectionCollapsible?: boolean;
  /** Start sections collapsed */
  sectionDefaultCollapsed?: boolean;
  /** Indent child items by this many px */
  childIndent?: number;          // default 16

  // ── Icons ─────────────────────────────────────────────────────────
  /** Show icons next to labels */
  showIcons?: boolean;
  iconSize?: number;             // px, default 14
}

/** Per-column display formatting for grouped-table and crosstab */
export interface ColumnFormat {
  /** Override the column header label */
  label?: string;
  /** Number format */
  numberFormat?: "auto" | "compact" | "percent" | "currency" | "integer";
  /** Currency code (default USD) */
  currencyCode?: string;
  /** Decimal places */
  decimals?: number;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Text/value color (CSS color) */
  textColor?: string;
  /** Cell background color (CSS color) */
  bgColor?: string;
  /** Fixed column width (e.g. "120px" or "15%") */
  width?: string;
  /** Threshold-based conditional formatting */
  thresholdRules?: ThresholdRule[];
}

/** Column definition for grouped-table: assigns each column a role */
export interface GroupedTableColumn {
  /** SQL column name */
  column: string;
  /** dimension = left-side grouping header; measure = right-side numeric value */
  role: "dimension" | "measure";
  /** Per-column formatting */
  format?: ColumnFormat;
}

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
  /** Source node column (network graph) */
  source?: string;
  /** Target node column (network graph) */
  target?: string;
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
  /** Number display format */
  numberFormat?: "auto" | "compact" | "percent" | "currency" | "integer";
  /** Currency code for currency format (default: USD) */
  currencyCode?: string;
  /** Number of decimal places (overrides format default) */
  decimals?: number;
  /** Threshold rules for conditional formatting */
  thresholdRules?: ThresholdRule[];
  /** Network graph: node circle radius */
  networkNodeRadius?: number;
  /** Network graph: show node labels */
  networkShowLabels?: boolean;
  /** Network graph: link distance target */
  networkLinkDistance?: number;
  /** Network graph: charge strength (repulsion) */
  networkCharge?: number;
  // ─── Grouped Table ─────────────────────────────────────────────
  /** Column definitions (role + format) for grouped-table */
  groupedTableColumns?: GroupedTableColumn[];
  /** Subtotal mode: "none" = no subtotals, "sql-rollup" = detect ROLLUP nulls, "computed" = component-computed */
  groupedTableSubtotals?: "none" | "sql-rollup" | "computed";
  /** Show a grand total row at the bottom */
  groupedTableShowGrandTotal?: boolean;
  /** Compact row height */
  groupedTableCompact?: boolean;
  /** Zebra striping on data rows */
  groupedTableStriped?: boolean;
  // ─── Crosstab ──────────────────────────────────────────────────
  /** Column to use as row headers */
  crosstabRowDim?: string;
  /** Column to pivot into column headers */
  crosstabColDim?: string;
  /** Column containing the measure value */
  crosstabMeasure?: string;
  /** Aggregation function when multiple rows share the same row+col key */
  crosstabAggregation?: "sum" | "avg" | "count" | "min" | "max";
  /** Enable color scale (gradient) conditional formatting */
  crosstabColorScale?: boolean;
  /** Color for the minimum value in the scale (CSS hex) */
  crosstabColorMin?: string;
  /** Color for the maximum value in the scale (CSS hex) */
  crosstabColorMax?: string;
  /** Show per-row total column */
  crosstabShowRowTotals?: boolean;
  /** Show per-column total row */
  crosstabShowColTotals?: boolean;
  /** Per-column format overrides keyed by col-dimension value */
  crosstabColumnFormats?: Record<string, ColumnFormat>;
  /** Raw SELECT that feeds the DuckDB PIVOT — stored separately from panel.query.sql */
  crosstabSourceSql?: string;
  /** Column names from the last successful run of crosstabSourceSql — populates dim/measure pickers */
  crosstabSourceColumns?: string[];
  // ─── Nav Bar ───────────────────────────────────────────────────────
  /** Nav bar configuration (used when visualization type is "nav-bar") */
  navBarConfig?: NavBarConfig;
}
