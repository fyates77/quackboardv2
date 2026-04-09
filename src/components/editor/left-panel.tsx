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

const ADD_ELEMENT_TYPES = [
  { type: "text", icon: <Type size={16} />, label: "Text" },
  { type: "bar", icon: <BarChart2 size={16} />, label: "Chart" },
  { type: "table", icon: <Table2 size={16} />, label: "Table" },
  { type: "kpi", icon: <LayoutDashboard size={16} />, label: "KPI" },
  { type: "image", icon: <Image size={16} />, label: "Image" },
  { type: "section", icon: <RectangleHorizontal size={16} />, label: "Section" },
];

function typeIcon(type: VisualizationType | undefined) {
  switch (type) {
    case "bar":
    case "line":
    case "area":
    case "scatter":
    case "pie":
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
      return <Type size={12} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
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
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px 4px 26px",
                border: "none",
                background: isSelected ? "var(--color-background-info)" : "transparent",
                color: isSelected ? "var(--color-text-info)" : "var(--color-text-primary)",
                cursor: "pointer",
                fontSize: 12,
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-background-secondary)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
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
          padding: "8px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 4,
        }}
      >
        {ADD_ELEMENT_TYPES.map(({ type, icon, label }) => (
          <button
            key={type}
            onClick={() => onAddPanel(type)}
            title={`Add ${label}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: "6px 4px",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
              background: "transparent",
              color: "var(--color-muted-foreground)",
              cursor: "pointer",
              fontSize: 10,
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--color-background-secondary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            {icon}
            {label}
          </button>
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
