import { useState } from "react";
import type { Dashboard } from "@/types/dashboard";
import type { QueryResult } from "@/engine/types";
import { TopBar } from "./top-bar";
import { IconRail } from "./icon-rail";
import { LeftPanel } from "./left-panel";
import { CanvasArea } from "./canvas-area";
import { RightPanel } from "./right-panel";

export type EditorTool = "select" | "frame" | "text" | "chart" | "image";
export type RailTab = "layers" | "data" | "components" | "pages" | "settings";
export type RightTab = "design" | "data" | "interact" | "json";

export interface EditorShellProps {
  dashboardId: string;
  dashboard: Dashboard;
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  activeRailTab: RailTab;
  onRailTabChange: (tab: RailTab) => void;
  activeRightTab: RightTab;
  onRightTabChange: (tab: RightTab) => void;
  previewMode: boolean;
  onPreviewToggle: () => void;
  queryResults: Map<string, QueryResult>;
  loadingPanels: Set<string>;
  onAddPanel: (type?: string) => void;
  onQueryResult: (panelId: string, result: QueryResult) => void;
}

export function EditorShell({
  dashboardId,
  dashboard,
  selectedId,
  onSelectElement,
  activeTool,
  onToolChange,
  activeRailTab,
  onRailTabChange,
  activeRightTab,
  onRightTabChange,
  previewMode,
  onPreviewToggle,
  queryResults,
  loadingPanels,
  onAddPanel,
  onQueryResult,
}: EditorShellProps) {
  const selectedPanel = selectedId
    ? dashboard.panels.find((p) => p.id === selectedId) ?? null
    : null;

  const [canvasZoom, setCanvasZoom] = useState(1);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "44px 1fr",
        gridTemplateColumns: "52px 240px 1fr 280px",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "var(--color-background-primary)",
      }}
    >
      {/* Top bar — spans all columns */}
      <div style={{ gridColumn: "1 / -1", gridRow: "1" }}>
        <TopBar
          dashboardId={dashboardId}
          dashboardName={dashboard.name}
          activeTool={activeTool}
          onToolChange={onToolChange}
          previewMode={previewMode}
          onPreviewToggle={onPreviewToggle}
          zoom={canvasZoom}
        />
      </div>

      {/* Icon rail */}
      <div style={{ gridColumn: "1", gridRow: "2" }}>
        <IconRail activeTab={activeRailTab} onTabChange={onRailTabChange} />
      </div>

      {/* Left panel */}
      <div style={{ gridColumn: "2", gridRow: "2" }}>
        <LeftPanel
          dashboardId={dashboardId}
          dashboard={dashboard}
          railTab={activeRailTab}
          selectedId={selectedId}
          onSelectElement={onSelectElement}
          onAddPanel={onAddPanel}
        />
      </div>

      {/* Canvas area */}
      <div style={{ gridColumn: "3", gridRow: "2", overflow: "hidden" }}>
        <CanvasArea
          dashboardId={dashboardId}
          dashboard={dashboard}
          selectedId={selectedId}
          onSelectElement={onSelectElement}
          activeTool={activeTool}
          queryResults={queryResults}
          loadingPanels={loadingPanels}
          previewMode={previewMode}
          onAddPanel={onAddPanel}
          onZoomChange={setCanvasZoom}
        />
      </div>

      {/* Right panel */}
      <div style={{ gridColumn: "4", gridRow: "2", overflow: "hidden", height: "100%" }}>
        <RightPanel
          dashboardId={dashboardId}
          selectedPanel={selectedPanel}
          activeTab={activeRightTab}
          onTabChange={onRightTabChange}
          queryResults={queryResults}
          onQueryResult={onQueryResult}
        />
      </div>
    </div>
  );
}
