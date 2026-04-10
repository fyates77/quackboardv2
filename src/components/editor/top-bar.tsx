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
} from "lucide-react";
import type { EditorTool } from "./editor-shell";

interface TopBarProps {
  dashboardName: string;
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  previewMode: boolean;
  onPreviewToggle: () => void;
}

const EDITING_TOOLS: Array<{ tool: EditorTool; icon: React.ReactNode; title: string }> = [
  { tool: "select", icon: <MousePointer2 size={14} />, title: "Select (V)" },
  { tool: "frame", icon: <RectangleHorizontal size={14} />, title: "Frame (F)" },
  { tool: "text", icon: <Type size={14} />, title: "Text (T)" },
  { tool: "chart", icon: <BarChart2 size={14} />, title: "Chart block" },
  { tool: "image", icon: <Image size={14} />, title: "Image" },
];

export function TopBar({
  dashboardName,
  activeTool,
  onToolChange,
  previewMode,
  onPreviewToggle,
}: TopBarProps) {
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

      {/* Add section */}
      <ToolGroup>
        <ToolButton title="Add section">
          <Plus size={14} />
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
          title="Zoom level"
        >
          100%
        </button>
      </div>

      {/* Right actions */}
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
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="ed-btn"
      data-active={active ? "true" : "false"}
      style={{
        width: 28,
        height: 28,
        borderRadius: "var(--border-radius-md)",
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
