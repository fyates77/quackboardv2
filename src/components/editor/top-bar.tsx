import { useState } from "react";
import {
  MousePointer2,
  RectangleHorizontal,
  Type,
  BarChart2,
  Image,
  Plus,
  ChevronRight,
  Share2,
  ExternalLink,
  Undo2,
  Redo2,
  Magnet,
  Download,
  FileJson,
  FileCode,
} from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useUIStore } from "@/stores/ui-store";
import { exportSingleDashboard } from "@/lib/export-import";
import type { EditorTool } from "./editor-shell";

interface TopBarProps {
  dashboardId: string;
  dashboardName: string;
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  previewMode: boolean;
  onPreviewToggle: () => void;
  /** Current canvas zoom level (0.25–2) — provided by CanvasArea */
  zoom?: number;
  onFitToPage?: () => void;
}

const EDITING_TOOLS: Array<{ tool: EditorTool; icon: React.ReactNode; title: string }> = [
  { tool: "select", icon: <MousePointer2 size={14} />, title: "Select (V)" },
  { tool: "frame", icon: <RectangleHorizontal size={14} />, title: "Frame (F)" },
  { tool: "text", icon: <Type size={14} />, title: "Text (T)" },
  { tool: "chart", icon: <BarChart2 size={14} />, title: "Chart block" },
  { tool: "image", icon: <Image size={14} />, title: "Image" },
];

export function TopBar({
  dashboardId,
  dashboardName,
  activeTool,
  onToolChange,
  previewMode,
  onPreviewToggle,
  zoom = 1,
}: TopBarProps) {
  const { editorSnapEnabled, setEditorSnapEnabled } = useUIStore();
  const [editingZoom, setEditingZoom] = useState(false);
  const [zoomInput, setZoomInput] = useState("");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Undo/redo via zundo temporal store
  const temporal = (useDashboardStore as unknown as { temporal: { getState: () => { undo: () => void; redo: () => void; pastStates: unknown[]; futureStates: unknown[] } } }).temporal;
  const { undo, redo, pastStates, futureStates } = temporal.getState();
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  const handleZoomCommit = (raw: string) => {
    const n = parseInt(raw.replace("%", ""), 10);
    if (!isNaN(n)) {
      // We expose zoom changes via the onFitToPage callback mechanism;
      // for now just update the display and let CanvasArea manage actual zoom state.
      // The zoom is managed in CanvasArea local state — to allow external control
      // we'd need a ref/callback. For now just close the input.
    }
    setEditingZoom(false);
  };

  return (
    <div
      style={{
        height: 44,
        background: "var(--color-background-primary)",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 8,
        userSelect: "none",
      }}
    >
      {/* Brand */}
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-muted-foreground)", whiteSpace: "nowrap", marginRight: 4 }}>
        ⬡ Quackboard
      </span>

      <Divider />

      {/* Undo / Redo */}
      <ToolGroup>
        <ToolButton
          title="Undo (Ctrl+Z)"
          onClick={() => undo()}
          disabled={!canUndo}
        >
          <Undo2 size={14} />
        </ToolButton>
        <ToolButton
          title="Redo (Ctrl+Shift+Z)"
          onClick={() => redo()}
          disabled={!canRedo}
        >
          <Redo2 size={14} />
        </ToolButton>
      </ToolGroup>

      <Divider />

      {/* Editing tools */}
      <ToolGroup>
        {EDITING_TOOLS.map(({ tool, icon, title }) => (
          <ToolButton
            key={tool}
            title={title}
            active={!previewMode && activeTool === tool}
            onClick={() => { onToolChange(tool); }}
          >
            {icon}
          </ToolButton>
        ))}
      </ToolGroup>

      <Divider />

      {/* Add section + Snap toggle */}
      <ToolGroup>
        <ToolButton title="Add section">
          <Plus size={14} />
        </ToolButton>
        <ToolButton
          title={editorSnapEnabled ? "Snap enabled (click to disable)" : "Snap disabled (click to enable)"}
          active={editorSnapEnabled}
          onClick={() => setEditorSnapEnabled(!editorSnapEnabled)}
        >
          <Magnet size={14} />
        </ToolButton>
      </ToolGroup>

      {/* Breadcrumb + view controls (centered) */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
            {dashboardName}
          </span>
          <ChevronRight size={12} style={{ color: "var(--color-muted-foreground)", opacity: 0.5 }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>
            Page 1
          </span>
        </div>

        {/* Edit / Preview toggle */}
        <div
          style={{
            display: "flex",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "var(--border-radius-sm)",
            overflow: "hidden",
          }}
        >
          <SegmentButton active={!previewMode} onClick={() => previewMode && onPreviewToggle()}>
            Edit
          </SegmentButton>
          <SegmentButton active={previewMode} onClick={() => !previewMode && onPreviewToggle()}>
            Preview
          </SegmentButton>
        </div>

        {/* Zoom pill */}
        {editingZoom ? (
          <input
            autoFocus
            value={zoomInput}
            onChange={(e) => setZoomInput(e.target.value)}
            onBlur={() => handleZoomCommit(zoomInput)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleZoomCommit(zoomInput);
              if (e.key === "Escape") setEditingZoom(false);
            }}
            style={{
              width: 52,
              fontSize: 11,
              padding: "2px 6px",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-sm)",
              background: "var(--color-background-secondary)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-mono)",
              outline: "none",
              textAlign: "center",
            }}
          />
        ) : (
          <button
            style={{
              fontSize: 11,
              padding: "2px 8px",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-sm)",
              background: "transparent",
              color: "var(--color-muted-foreground)",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
            }}
            title="Click to set zoom (scroll wheel to zoom, Shift+1 to fit)"
            onClick={() => {
              setZoomInput(Math.round(zoom * 100) + "%");
              setEditingZoom(true);
            }}
          >
            {Math.round(zoom * 100)}%
          </button>
        )}
      </div>

      {/* Right actions */}
      <div style={{ position: "relative" }}>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            padding: "4px 10px",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "var(--border-radius-md)",
            background: "transparent",
            color: "var(--color-muted-foreground)",
            cursor: "pointer",
          }}
          onClick={() => setExportMenuOpen((v) => !v)}
          title="Export"
        >
          <Download size={12} />
          Export
        </button>

        {exportMenuOpen && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 4px)",
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-md)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              zIndex: 1000,
              minWidth: 180,
              overflow: "hidden",
            }}
            onMouseLeave={() => setExportMenuOpen(false)}
          >
            <button
              onClick={() => { exportSingleDashboard(dashboardId); setExportMenuOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "8px 12px", border: "none", background: "transparent",
                color: "var(--color-text-primary)", fontSize: 12, cursor: "pointer",
                textAlign: "left",
              }}
            >
              <FileJson size={13} />
              Export as JSON
            </button>
            <button
              onClick={() => {
                import("@/lib/export-import").then(({ exportAsStandaloneHTML }) => {
                  const { dashboards } = useDashboardStore.getState();
                  const dash = dashboards[dashboardId];
                  if (dash) exportAsStandaloneHTML(dash);
                });
                setExportMenuOpen(false);
              }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "8px 12px", border: "none", background: "transparent",
                color: "var(--color-text-primary)", fontSize: 12, cursor: "pointer",
                textAlign: "left",
              }}
            >
              <FileCode size={13} />
              Export as HTML
            </button>
          </div>
        )}
      </div>

      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 12,
          padding: "4px 10px",
          border: "0.5px solid var(--color-border-secondary)",
          borderRadius: "var(--border-radius-md)",
          background: "transparent",
          color: "var(--color-muted-foreground)",
          cursor: "pointer",
        }}
      >
        <Share2 size={12} />
        Share
      </button>

      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 12,
          fontWeight: 500,
          padding: "4px 12px",
          border: "none",
          borderRadius: "var(--border-radius-md)",
          background: "var(--color-primary)",
          color: "var(--color-primary-foreground)",
          cursor: "pointer",
        }}
      >
        Publish
        <ExternalLink size={11} />
      </button>
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: "0.5px",
        height: 20,
        background: "var(--color-border-secondary)",
        flexShrink: 0,
      }}
    />
  );
}

function ToolGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
      {children}
    </div>
  );
}

function ToolButton({
  children,
  active,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="ed-btn"
      data-active={active ? "true" : "false"}
      style={{
        width: 28,
        height: 28,
        borderRadius: "var(--border-radius-md)",
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function SegmentButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11,
        padding: "3px 10px",
        border: "none",
        background: active ? "var(--color-background-secondary)" : "transparent",
        color: active ? "var(--color-text-primary)" : "var(--color-muted-foreground)",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
      }}
    >
      {children}
    </button>
  );
}
