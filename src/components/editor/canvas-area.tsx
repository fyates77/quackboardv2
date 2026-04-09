import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart2, Table2, Type, Image, LayoutDashboard, RectangleHorizontal } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import type { Dashboard, CanvasPosition, Panel } from "@/types/dashboard";
import type { QueryResult } from "@/engine/types";
import type { EditorTool } from "./editor-shell";

interface CanvasAreaProps {
  dashboardId: string;
  dashboard: Dashboard;
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  activeTool: EditorTool;
  queryResults: Map<string, QueryResult>;
  loadingPanels: Set<string>;
  previewMode: boolean;
  onAddPanel: (type?: string) => void;
}

const PAGE_WIDTH_DEFAULT = 1200;
const ELEMENT_DEFAULT_W = 360;
const ELEMENT_DEFAULT_H = 240;
const GRID_GAP = 24;
const SELECTION_BLUE = "#378ADD";

/** Auto-assign a canvas position for a panel that doesn't have one yet */
function defaultPosition(index: number, pageWidth: number): CanvasPosition {
  const cols = Math.floor(pageWidth / (ELEMENT_DEFAULT_W + GRID_GAP));
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    x: col * (ELEMENT_DEFAULT_W + GRID_GAP) + GRID_GAP,
    y: row * (ELEMENT_DEFAULT_H + GRID_GAP) + GRID_GAP,
    w: ELEMENT_DEFAULT_W,
    h: ELEMENT_DEFAULT_H,
  };
}

function getPos(dashboard: Dashboard, panelId: string, index: number): CanvasPosition {
  return (
    dashboard.canvasPositions?.[panelId] ??
    defaultPosition(index, dashboard.pageWidth ?? PAGE_WIDTH_DEFAULT)
  );
}

/** Compute the bounding height of all elements to set page min-height */
function pageContentHeight(dashboard: Dashboard): number {
  let max = 400;
  dashboard.panels.forEach((p, i) => {
    const pos = getPos(dashboard, p.id, i);
    max = Math.max(max, pos.y + pos.h + GRID_GAP);
  });
  return max;
}

// ── Ruler ─────────────────────────────────────────────────────────────────

function Ruler({ width }: { width: number }) {
  const tickInterval = 80;
  const ticks = Math.ceil(width / tickInterval);

  return (
    <div
      style={{
        height: 20,
        background: "var(--color-background-primary)",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        position: "relative",
        flexShrink: 0,
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {Array.from({ length: ticks }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: i * tickInterval,
            top: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: "0.5px",
              height: 6,
              background: "var(--color-border-secondary)",
            }}
          />
          <span
            style={{
              fontSize: 9,
              color: "var(--color-muted-foreground)",
              fontFamily: "var(--font-mono)",
              marginLeft: 2,
              lineHeight: 1,
            }}
          >
            {i * tickInterval}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Element preview content ────────────────────────────────────────────────

function ElementPreview({ panel, result, loading }: {
  panel: Panel;
  result: QueryResult | null;
  loading: boolean;
}) {
  const type = panel.visualization?.type;

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: "2px solid var(--color-border-secondary)",
            borderTopColor: "var(--color-text-info)",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  if (type === "kpi") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-md)",
              padding: "8px 12px",
              minWidth: 64,
            }}
          >
            <div style={{ fontSize: 9, color: "var(--color-muted-foreground)", marginBottom: 2 }}>
              {result?.columns[i]?.name ?? `Metric ${i + 1}`}
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
              {result ? String(result.rows[0]?.[result.columns[i]?.name ?? ""] ?? "—") : "—"}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "table" || type === "grouped-table") {
    const cols = result?.columns.slice(0, 4) ?? [];
    const rows = result?.rows.slice(0, 4) ?? [];
    return (
      <div style={{ flex: 1, overflow: "hidden", padding: "4px 8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
          <thead>
            <tr>
              {cols.map((c) => (
                <th
                  key={c.name}
                  style={{
                    padding: "3px 6px",
                    textAlign: "left",
                    fontWeight: 500,
                    color: "var(--color-muted-foreground)",
                    background: "var(--color-background-secondary)",
                    borderBottom: "0.5px solid var(--color-border-tertiary)",
                  }}
                >
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : "var(--color-background-secondary)" }}>
                {cols.map((c) => (
                  <td key={c.name} style={{ padding: "3px 6px", color: "var(--color-text-primary)" }}>
                    {String(row[c.name] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === "image") {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "0.5px dashed var(--color-border-secondary)",
          margin: 8,
          borderRadius: "var(--border-radius-sm)",
          background: "var(--color-background-secondary)",
          gap: 6,
          color: "var(--color-muted-foreground)",
          fontSize: 11,
        }}
      >
        <Image size={16} />
        Drop image or paste URL
      </div>
    );
  }

  if (type === "markdown" || type === "html") {
    return (
      <div style={{ flex: 1, padding: "8px 10px" }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }}>
          {panel.title}
        </div>
        <div style={{ fontSize: 10, color: "var(--color-muted-foreground)" }}>
          {panel.markdownContent
            ? panel.markdownContent.slice(0, 120)
            : "Text content…"}
        </div>
      </div>
    );
  }

  // Default: bar chart preview
  const barHeights = result?.rows.slice(0, 8).map(() => Math.random() * 80 + 16) ?? [60, 80, 50, 90, 40, 70, 55, 85];
  return (
    <div style={{ flex: 1, padding: "8px", display: "flex", flexDirection: "column", gap: 4 }}>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          height: 96,
        }}
      >
        {barHeights.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              borderRadius: "2px 2px 0 0",
              background: "var(--color-background-info)",
              minWidth: 4,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Canvas element (panel in canvas) ────────────────────────────────────────

interface CanvasElementProps {
  panel: Panel;
  pos: CanvasPosition;
  selected: boolean;
  result: QueryResult | null;
  loading: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, corner: string) => void;
}

function CanvasElement({
  panel,
  pos,
  selected,
  result,
  loading,
  onSelect,
  onDragStart,
  onResizeStart,
}: CanvasElementProps) {
  const type = panel.visualization?.type;
  const hasSql = !!panel.query.sql.trim();

  return (
    <div
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: pos.w,
        height: pos.h,
        cursor: "pointer",
        userSelect: "none",
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect();
        onDragStart(e);
      }}
    >
      {/* Content card */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "var(--color-background-primary)",
          border: selected
            ? `1.5px solid ${SELECTION_BLUE}`
            : "0.5px solid var(--color-border-secondary)",
          borderRadius: "var(--border-radius-md)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "5px 8px",
            borderBottom: "0.5px solid var(--color-border-tertiary)",
            gap: 6,
            flexShrink: 0,
          }}
        >
          {typeIcon(type)}
          <span
            style={{
              flex: 1,
              fontSize: 11,
              fontWeight: 500,
              color: "var(--color-text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
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
                border: "0.5px solid var(--color-border-warning)",
                flexShrink: 0,
              }}
            >
              SQL
            </span>
          )}
        </div>

        {/* Content */}
        <ElementPreview panel={panel} result={result} loading={loading} />
      </div>

      {/* Resize handles — only when selected */}
      {selected && (
        <>
          {(["nw", "ne", "se", "sw"] as const).map((corner) => (
            <ResizeHandle
              key={corner}
              corner={corner}
              pos={pos}
              onResizeStart={onResizeStart}
            />
          ))}
        </>
      )}
    </div>
  );
}

function ResizeHandle({
  corner,
  pos,
  onResizeStart,
}: {
  corner: "nw" | "ne" | "se" | "sw";
  pos: CanvasPosition;
  onResizeStart: (e: React.MouseEvent, corner: string) => void;
}) {
  const HANDLE = 8;
  const style: React.CSSProperties = {
    position: "absolute",
    width: HANDLE,
    height: HANDLE,
    background: "var(--color-background-primary)",
    border: `1.5px solid ${SELECTION_BLUE}`,
    borderRadius: 2,
    cursor: corner === "se" || corner === "nw" ? "nwse-resize" : "nesw-resize",
    zIndex: 10,
    ...cornerPosition(corner, pos, HANDLE),
  };

  return (
    <div
      style={style}
      onMouseDown={(e) => {
        e.stopPropagation();
        onResizeStart(e, corner);
      }}
    />
  );
}

function cornerPosition(
  corner: "nw" | "ne" | "se" | "sw",
  pos: CanvasPosition,
  handle: number,
): React.CSSProperties {
  const off = -handle / 2;
  switch (corner) {
    case "nw": return { left: off, top: off };
    case "ne": return { left: pos.w - handle / 2, top: off };
    case "se": return { left: pos.w - handle / 2, top: pos.h - handle / 2 };
    case "sw": return { left: off, top: pos.h - handle / 2 };
  }
}

function typeIcon(type: string | undefined) {
  switch (type) {
    case "table":
    case "grouped-table":
      return <Table2 size={11} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
    case "kpi":
      return <LayoutDashboard size={11} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
    case "image":
      return <Image size={11} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
    case "markdown":
    case "html":
      return <Type size={11} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
    default:
      return <BarChart2 size={11} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
  }
}

// ── Main canvas area ─────────────────────────────────────────────────────────

interface DragState {
  type: "move" | "resize";
  id: string;
  corner?: string;
  startX: number;
  startY: number;
  origPos: CanvasPosition;
}

export function CanvasArea({
  dashboardId,
  dashboard,
  selectedId,
  onSelectElement,
  activeTool,
  queryResults,
  loadingPanels,
  onAddPanel,
}: CanvasAreaProps) {
  const updateCanvasPosition = useDashboardStore((s) => s.updateCanvasPosition);
  const pageWidth = dashboard.pageWidth ?? PAGE_WIDTH_DEFAULT;
  const pageHeight = pageContentHeight(dashboard);

  const dragRef = useRef<DragState | null>(null);
  // Ref holds the authoritative live position during a drag — readable from any
  // closure without being a dep of the mousemove/mouseup effect. State is only
  // used to schedule re-renders (set from event handlers, never from the effect body).
  const livePosRef = useRef<Record<string, CanvasPosition>>({});
  const [livePositions, setLivePositions] = useState<Record<string, CanvasPosition>>({});

  const handleDragStart = useCallback(
    (e: React.MouseEvent, panel: Panel, index: number) => {
      if (activeTool !== "select") return;
      e.preventDefault();
      const origPos = getPos(dashboard, panel.id, index);
      dragRef.current = {
        type: "move",
        id: panel.id,
        startX: e.clientX,
        startY: e.clientY,
        origPos,
      };
    },
    [activeTool, dashboard],
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, panel: Panel, index: number, corner: string) => {
      e.preventDefault();
      const origPos = getPos(dashboard, panel.id, index);
      dragRef.current = {
        type: "resize",
        id: panel.id,
        corner,
        startX: e.clientX,
        startY: e.clientY,
        origPos,
      };
    },
    [dashboard],
  );

  // Stable effect — deps never change after mount. All mutable state is accessed
  // via refs so the effect doesn't need to re-register listeners on every drag tick.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const orig = drag.origPos;

      let newPos: CanvasPosition;
      if (drag.type === "move") {
        newPos = {
          ...orig,
          x: Math.max(0, orig.x + dx),
          y: Math.max(0, orig.y + dy),
        };
      } else {
        const corner = drag.corner ?? "se";
        let { x, y, w, h } = orig;
        if (corner.includes("e")) w = Math.max(80, orig.w + dx);
        if (corner.includes("s")) h = Math.max(60, orig.h + dy);
        if (corner.includes("w")) { x = orig.x + dx; w = Math.max(80, orig.w - dx); }
        if (corner.includes("n")) { y = orig.y + dy; h = Math.max(60, orig.h - dy); }
        newPos = { x, y, w, h };
      }

      livePosRef.current = { ...livePosRef.current, [drag.id]: newPos };
      setLivePositions({ ...livePosRef.current }); // trigger re-render
    };

    const onUp = () => {
      const drag = dragRef.current;
      if (!drag) return;
      // Read final position from the ref — never from closed-over state
      const finalPos = livePosRef.current[drag.id];
      if (finalPos) {
        updateCanvasPosition(dashboardId, drag.id, finalPos);
      }
      dragRef.current = null;
      delete livePosRef.current[drag.id];
      setLivePositions({ ...livePosRef.current });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardId, updateCanvasPosition]); // stable — intentionally excludes livePositions

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectElement(null);
    }
    if (activeTool !== "select") {
      onAddPanel(activeTool);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <Ruler width={pageWidth + 80} />

      {/* Infinite canvas */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          background: "var(--color-background-tertiary)",
          backgroundImage:
            "radial-gradient(circle, var(--color-border-tertiary) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: 24,
          cursor: activeTool !== "select" ? "crosshair" : "default",
        }}
        onClick={handleCanvasClick}
      >
        {/* Page frame */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          {/* Page label */}
          <div
            style={{
              fontSize: 10,
              color: "var(--color-muted-foreground)",
              marginBottom: 6,
              fontFamily: "var(--font-mono)",
            }}
          >
            {dashboard.name} · {pageWidth}px
          </div>

          {/* Page white rectangle */}
          <div
            style={{
              position: "relative",
              width: pageWidth,
              minHeight: pageHeight,
              background: "var(--color-background-primary)",
              border: "1px solid var(--color-border-secondary)",
              borderRadius: 4,
              overflow: "visible",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) onSelectElement(null);
            }}
          >
            {dashboard.panels.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  color: "var(--color-muted-foreground)",
                  pointerEvents: "none",
                }}
              >
                <RectangleHorizontal size={32} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: 13, fontWeight: 500, opacity: 0.5 }}>
                  Empty canvas
                </p>
                <p style={{ fontSize: 11, opacity: 0.4 }}>
                  Add elements from the left panel
                </p>
              </div>
            )}

            {dashboard.panels.map((panel, index) => {
              const pos = livePositions[panel.id] ?? getPos(dashboard, panel.id, index);
              return (
                <CanvasElement
                  key={panel.id}
                  panel={panel}
                  pos={pos}
                  selected={selectedId === panel.id}
                  result={queryResults.get(panel.id) ?? null}
                  loading={loadingPanels.has(panel.id)}
                  onSelect={() => onSelectElement(panel.id)}
                  onDragStart={(e) => handleDragStart(e, panel, index)}
                  onResizeStart={(e, corner) => handleResizeStart(e, panel, index, corner)}
                />
              );
            })}
          </div>

          {/* Resize handle dot (page width) */}
          <div
            style={{
              position: "absolute",
              bottom: -5,
              right: -5,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--color-background-primary)",
              border: `1.5px solid ${SELECTION_BLUE}`,
              cursor: "ew-resize",
            }}
            title="Drag to resize page width"
          />
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
