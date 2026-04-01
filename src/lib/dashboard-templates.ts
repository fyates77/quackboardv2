import type { Dashboard } from "@/types/dashboard";

export type DashboardTemplate = {
  id: string;
  name: string;
  description: string;
  data: Omit<Dashboard, "id" | "createdAt" | "updatedAt">;
};

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Start from scratch with an empty canvas.",
    data: {
      name: "Untitled Dashboard",
      description: "",
      panels: [],
      layout: [],
      filters: [],
      settings: { refreshInterval: null, defaultDataSourceId: null },
    },
  },
  {
    id: "executive-summary",
    name: "Executive Summary",
    description: "KPI row, trend line, and data table — the standard exec briefing.",
    data: {
      name: "Executive Summary",
      description: "High-level performance overview",
      panels: [
        {
          id: "kpi1",
          title: "Total Revenue",
          query: { sql: "SELECT 1234567 AS value", dataSourceId: null },
          visualization: { type: "kpi", mapping: { value: "value" }, options: { numberFormat: "compact" } },
        },
        {
          id: "kpi2",
          title: "Active Users",
          query: { sql: "SELECT 8421 AS value", dataSourceId: null },
          visualization: { type: "kpi", mapping: { value: "value" }, options: { numberFormat: "compact" } },
        },
        {
          id: "kpi3",
          title: "Conversion Rate",
          query: { sql: "SELECT 0.034 AS value", dataSourceId: null },
          visualization: { type: "kpi", mapping: { value: "value" }, options: { numberFormat: "percent" } },
        },
        {
          id: "trend1",
          title: "Revenue Trend",
          query: { sql: "SELECT date, revenue FROM monthly_revenue ORDER BY date", dataSourceId: null },
          visualization: { type: "line", mapping: { x: "date", y: "revenue" }, options: { showTooltip: true } },
        },
        {
          id: "table1",
          title: "Detail Table",
          query: { sql: "SELECT * FROM your_table LIMIT 50", dataSourceId: null },
          visualization: { type: "table", mapping: {}, options: { pageSize: 10 } },
        },
      ],
      layout: [
        { i: "kpi1", x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
        { i: "kpi2", x: 4, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
        { i: "kpi3", x: 8, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
        { i: "trend1", x: 0, y: 2, w: 8, h: 4, minW: 2, minH: 2 },
        { i: "table1", x: 8, y: 2, w: 4, h: 4, minW: 2, minH: 2 },
      ],
      filters: [],
      settings: { refreshInterval: null, defaultDataSourceId: null },
    },
  },
  {
    id: "sales-pipeline",
    name: "Sales Pipeline",
    description: "Funnel, bar chart, and KPI — visualise conversion through your pipeline.",
    data: {
      name: "Sales Pipeline",
      description: "Conversion funnel and stage breakdown",
      panels: [
        {
          id: "funnel1",
          title: "Pipeline Funnel",
          query: { sql: "SELECT stage, count FROM pipeline_stages ORDER BY stage_order", dataSourceId: null },
          visualization: { type: "funnel", mapping: { category: "stage", value: "count" }, options: { funnelShowPercentage: true, funnelShowConversion: true } },
        },
        {
          id: "bar1",
          title: "Revenue by Stage",
          query: { sql: "SELECT stage, revenue FROM pipeline_stages", dataSourceId: null },
          visualization: { type: "bar", mapping: { x: "stage", y: "revenue" }, options: { showTooltip: true } },
        },
        {
          id: "kpi4",
          title: "Pipeline Value",
          query: { sql: "SELECT 2450000 AS value", dataSourceId: null },
          visualization: { type: "kpi", mapping: { value: "value" }, options: { numberFormat: "currency", prefix: "$" } },
        },
      ],
      layout: [
        { i: "funnel1", x: 0, y: 0, w: 5, h: 5, minW: 2, minH: 2 },
        { i: "bar1", x: 5, y: 0, w: 5, h: 5, minW: 2, minH: 2 },
        { i: "kpi4", x: 10, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
      ],
      filters: [],
      settings: { refreshInterval: null, defaultDataSourceId: null },
    },
  },
  {
    id: "data-report",
    name: "Data Report",
    description: "Narrative header, breakdown chart, and detail table — the data story format.",
    data: {
      name: "Data Report",
      description: "Narrative data report with context",
      layoutMode: "scroll",
      panels: [
        {
          id: "md1",
          title: "Report Header",
          markdownContent: "# Report Title\n\nA brief description of what this report covers and its key findings. Edit this section to provide context for your data.\n\n---",
          query: { sql: "", dataSourceId: null },
          visualization: { type: "markdown", mapping: {}, options: {} },
          fullWidth: true,
        },
        {
          id: "treemap1",
          title: "Breakdown",
          query: { sql: "SELECT category, value FROM breakdown_table", dataSourceId: null },
          visualization: { type: "treemap", mapping: { path: "category", value: "value" }, options: { treemapTiling: "squarify" } },
        },
        {
          id: "table2",
          title: "Full Data",
          query: { sql: "SELECT * FROM your_table LIMIT 100", dataSourceId: null },
          visualization: { type: "table", mapping: {}, options: { pageSize: 20 } },
          fullWidth: true,
        },
      ],
      layout: [
        { i: "md1", x: 0, y: 0, w: 12, h: 2, minW: 2, minH: 2 },
        { i: "treemap1", x: 0, y: 2, w: 12, h: 5, minW: 2, minH: 2 },
        { i: "table2", x: 0, y: 7, w: 12, h: 5, minW: 2, minH: 2 },
      ],
      filters: [],
      settings: { refreshInterval: null, defaultDataSourceId: null },
    },
  },
];
