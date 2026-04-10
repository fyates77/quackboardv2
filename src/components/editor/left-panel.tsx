import { useState } from "react";
import {
  ChevronRight,
  RectangleHorizontal,
  BarChart2,
  Table2,
  Type,
  Image,
  LayoutDashboard,
  Eye,
  TrendingUp,
  PieChart,
  Box,
  Grid3x3,
  Filter,
  Network,
  Activity,
  GitMerge,
  Code,
  Navigation,
  ExternalLink,
} from "lucide-react";
import type { Dashboard } from "@/types/dashboard";
import type { RailTab } from "./editor-shell";
import { SchemaBrowser } from "@/components/data-sources/schema-browser";
import type { VisualizationType } from "@/types/dashboard";

interface LeftPanelProps {
  dashboardId: string;
  dashboard: Dashboard;
  railTab: RailTab;
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  onAddPanel: (type?: string) => void;
}

const ADD_ELEMENT_GROUPS = [
  {
    label: "Charts",
    items: [
      { type: "bar", icon: <BarChart2 size={13} />, label: "Bar" },
      { type: "line", icon: <TrendingUp size={13} />, label: "Line" },
      { type: "area", icon: <Activity size={13} />, label: "Area" },
      { type: "scatter", icon: <Activity size={13} />, label: "Scatter" },
      { type: "pie", icon: <PieChart size={13} />, label: "Pie" },
      { type: "histogram", icon: <BarChart2 size={13} />, label: "Histogram" },
      { type: "box", icon: <Box size={13} />, label: "Box" },
      { type: "heatmap", icon: <Grid3x3 size={13} />, label: "Heatmap" },
      { type: "waffle", icon: <Grid3x3 size={13} />, label: "Waffle" },
      { type: "combo", icon: <BarChart2 size={13} />, label: "Combo" },
      { type: "funnel", icon: <Filter size={13} />, label: "Funnel" },
      { type: "treemap", icon: <LayoutDashboard size={13} />, label: "Treemap" },
      { type: "tree", icon: <Network size={13} />, label: "Tree" },
      { type: "density", icon: <Activity size={13} />, label: "Density" },
      { type: "difference", icon: <TrendingUp size={13} />, label: "Diff" },
      { type: "flow", icon: <GitMerge size={13} />, label: "Flow" },
      { type: "network", icon: <Network size={13} />, label: "Network" },
    ],
  },
  {
    label: "Tables",
    items: [
      { type: "table", icon: <Table2 size={13} />, label: "Table" },
      { type: "grouped-table", icon: <Table2 size={13} />, label: "Grouped" },
      { type: "crosstab", icon: <Table2 size={13} />, label: "Crosstab" },
    ],
  },
  {
    label: "Content",
    items: [
      { type: "kpi", icon: <LayoutDashboard size={13} />, label: "KPI" },
      { type: "markdown", icon: <Type size={13} />, label: "Text" },
      { type: "image", icon: <Image size={13} />, label: "Image" },
      { type: "embed", icon: <ExternalLink size={13} />, label: "Embed" },
      { type: "html", icon: <Code size={13} />, label: "HTML" },
      { type: "custom", icon: <Code size={13} />, label: "Custom" },
      { type: "nav-bar", icon: <Navigation size={13} />, label: "Nav Bar" },
      { type: "section", icon: <RectangleHorizontal size={13} />, label: "Section" },
    ],
  },
];

function typeIcon(type: VisualizationType | undefined) {
  switch (type) {
    case "bar":
    case "line":
    case "area":
    case "scatter":
    case "pie":
    case "histogram":
    case "box":
    case "heatmap":
    case "waffle":
    case "combo":
    case "funnel":
    case "treemap":
    case "tree":
    case "density":
    case "difference":
    case "flow":
    case "network":
      return <BarChart2 size={12} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
    case "table":
    case "grouped-table":
    case "crosstab":
      return <Table2 size={12} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
    case "kpi":
      return <LayoutDashboard size={12} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
    case "image":
      return <Image size={12} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
    case "markdown":
    case "html":
    case "embed":
    case "custom":
      return <Type size={12} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
    case "nav-bar":
      return <Navigation size={12} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
    default:
      return <RectangleHorizontal size={12} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
  }
}

function LayersTab({
  dashboard,
  selectedId,
  onSelectElement,
  onAddPanel,
}: {
  dashboard: Dashboard;
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  onAddPanel: (type?: string) => void;
}) {
  const [treeExpanded, setTreeExpanded] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Tab header */}
      <div
        style={{
          padding: "8px 10px 6px",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
          display: "flex",
          gap: 0,
        }}
      >
        <TabPill active>Layers</TabPill>
        <TabPill active={false}>Pages</TabPill>
        <TabPill active={false}>Assets</TabPill>
      </div>

      {/* Layer tree */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {/* Page node */}
        <button
          onClick={() => setTreeExpanded((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--color-text-primary)",
            textAlign: "left",
          }}
        >
          <ChevronRight
            size={12}
            style={{
              flexShrink: 0,
              color: "var(--color-muted-foreground)",
              transform: treeExpanded ? "rotate(90deg)" : "none",
              transition: "transform 0.15s",
            }}
          />
          <RectangleHorizontal size={12} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {dashboard.name}
          </span>
          <span
            style={{
              fontSize: 10,
              padding: "1px 5px",
              borderRadius: 4,
              background: "var(--color-background-secondary)",
              color: "var(--color-muted-foreground)",
            }}
          >
            page
          </span>
        </button>

        {/* Panel rows */}
        {treeExpanded && dashboard.panels.map((panel) => {
          const isSelected = selectedId === panel.id;
          const hasSql = !!panel.query.sql.trim();
          return (
            <button
              key={panel.id}
              onClick={() => onSelectElement(panel.id)}
              className="ed-layer-row"
              data-active={isSelected ? "true" : "false"}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px 4px 26px",
                border: "none",
                color: isSelected ? "var(--color-text-info)" : "var(--color-text-primary)",
                fontSize: 12,
                textAlign: "left",
              }}
            >
              {typeIcon(panel.visualization?.type)}
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {panel.title || "Untitled"}
              </span>
              {hasSql && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "1px 5px",
                    borderRadius: 4,
                    background: "var(--color-background-warning)",
                    color: "var(--color-text-warning)",
                    flexShrink: 0,
                  }}
                >
                  sql
                </span>
              )}
              <Eye size={11} style={{ color: "var(--color-muted-foreground)", opacity: 0, flexShrink: 0 }} className="layer-eye" />
            </button>
          );
        })}

        {dashboard.panels.length === 0 && (
          <p style={{ fontSize: 11, color: "var(--color-muted-foreground)", padding: "12px 10px", textAlign: "center" }}>
            No elements yet
          </p>
        )}
      </div>

      {/* Add element bar */}
      <div
        style={{
          borderTop: "0.5px solid var(--color-border-tertiary)",
          maxHeight: 220,
          overflowY: "auto",
          padding: "6px 8px 8px",
        }}
      >
        {ADD_ELEMENT_GROUPS.map(({ label, items }) => (
          <div key={label}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: "var(--color-muted-foreground)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "4px 2px 3px",
              }}
            >
              {label}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 3,
                marginBottom: 4,
              }}
            >
              {items.map(({ type, icon, label: itemLabel }) => (
                <button
                  key={type}
                  onClick={() => onAddPanel(type)}
                  title={`Add ${itemLabel}`}
                  className="ed-add-btn"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    padding: "5px 4px",
                    borderRadius: "var(--border-radius-sm)",
                    color: "var(--color-muted-foreground)",
                    fontSize: 9,
                  }}
                >
                  {icon}
                  {itemLabel}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabPill({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <button
      style={{
        padding: "2px 8px 4px",
        border: "none",
        borderBottom: active ? "2px solid var(--color-text-primary)" : "2px solid transparent",
        background: "transparent",
        color: active ? "var(--color-text-primary)" : "var(--color-muted-foreground)",
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 500,
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  );
}

export function LeftPanel({
  dashboardId: _dashboardId,
  dashboard,
  railTab,
  selectedId,
  onSelectElement,
  onAddPanel,
}: LeftPanelProps) {
  return (
    <div
      style={{
        width: 240,
        height: "100%",
        background: "var(--color-background-primary)",
        borderRight: "0.5px solid var(--color-border-tertiary)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {railTab === "layers" && (
        <LayersTab
          dashboard={dashboard}
          selectedId={selectedId}
          onSelectElement={onSelectElement}
          onAddPanel={onAddPanel}
        />
      )}

      {railTab === "data" && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "0.5px solid var(--color-border-tertiary)",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--color-muted-foreground)",
            }}
          >
            Data sources
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <SchemaBrowser />
          </div>
        </div>
      )}

      {(railTab === "components" || railTab === "pages" || railTab === "settings") && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            color: "var(--color-muted-foreground)",
          }}
        >
          {railTab === "components" && "Component library coming soon"}
          {railTab === "pages" && "Multi-page support coming soon"}
          {railTab === "settings" && "Canvas settings coming soon"}
        </div>
      )}
    </div>
  );
}
