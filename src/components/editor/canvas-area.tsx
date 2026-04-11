import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart2, Table2, Type, Image, LayoutDashboard, RectangleHorizontal } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useUIStore } from "@/stores/ui-store";
import { ChartRenderer } from "@/components/visualizations/chart-renderer";
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
  /** Callback to report current zoom level to parent (e.g. for the top bar pill) */
  onZoomChange?: (zoom: number) => void;
}

const PAGE_WIDTH_DEFAULT = 1200;
const ELEMENT_DEFAULT_W = 360;
const ELEMENT_DEFAULT_H = 240;
const GRID_GAP = 24;
const SELECTION_BLUE = "#378ADD";
const SNAP_THRESHOLD = 6; // px

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

/** Bounding box that encompasses all given positions */
function getBoundingBox(positions: CanvasPosition[]): { x: number; y: number; w: number; h: number } | null {
  if (!positions.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pos of positions) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + pos.w);
    maxY = Math.max(maxY, pos.y + pos.h);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
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

const CONTENT_TYPES = new Set(["markdown", "html", "embed", "image", "custom", "nav-bar"]);

function ElementPreview({ panel, result, loading }: {
  panel: Panel;
  result: QueryResult | null;
  loading: boolean;
}) {
  const type = panel.visualization?.type;

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--color-border-secondary)", borderTopColor: "var(--color-text-info)", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (CONTENT_TYPES.has(type ?? "")) {
    return (
      <div style={{ flex: 1, overflow: "hidden", pointerEvents: "none" }}>
        <ChartRenderer
          result={{ columns: [], rows: [], rowCount: 0, elapsed: 0 }}
          config={panel.visualization}
          panel={panel}
        />
      </div>
    );
  }

  if (result) {
    return (
      <div style={{ flex: 1, overflow: "hidden", pointerEvents: "none" }}>
        <ChartRenderer
          result={result}
          config={panel.visualization}
          panel={panel}
        />
      </div>
    );
  }

  if (type === "kpi") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "8px 12px", minWidth: 56 }}>
            <div style={{ fontSize: 9, color: "var(--color-muted-foreground)", marginBottom: 2 }}>Metric {i + 1}</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-muted-foreground)", opacity: 0.4 }}>—</div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "table" || type === "grouped-table" || type === "crosstab") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 10, color: "var(--color-muted-foreground)", opacity: 0.5 }}>No data — run a query</span>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: 8, display: "flex", alignItems: "flex-end", gap: 3 }}>
      {[60, 80, 50, 90, 40, 70, 55, 85].map((h, i) => (
        <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: "2px 2px 0 0", background: "var(--color-background-secondary)", opacity: 0.5 }} />
      ))}
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
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, corner: string) => void;
}

function CanvasElement({
  panel,
  pos,
  selected,
  result,
  loading,
  onMouseDown,
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
        zIndex: pos.zIndex ?? 0,
      }}
      onMouseDown={onMouseDown}
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
    case "crosstab":
      return <Table2 size={11} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
    case "kpi":
      return <LayoutDashboard size={11} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
    case "image":
      return <Image size={11} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
    case "markdown":
    case "html":
    case "embed":
    case "custom":
    case "vega-lite":
      return <Type size={11} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
    default:
      return <BarChart2 size={11} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />;
  }
}

// ── Snap guide line ──────────────────────────────────────────────────────────

interface GuideLine {
  axis: "x" | "y";
  position: number; // canvas coordinate
}

// ── Main canvas area ─────────────────────────────────────────────────────────

interface DragState {
  type: "move" | "resize" | "page-resize";
  id: string;
  corner?: string;
  startX: number;
  startY: number;
  origPos: CanvasPosition;
  /** For multi-panel move: original positions of all selected panels */
  allOrigPos?: Record<string, CanvasPosition>;
}

interface MarqueeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
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
  onZoomChange,
}: CanvasAreaProps) {
  const updateCanvasPosition = useDashboardStore((s) => s.updateCanvasPosition);
  const updatePageWidth = useDashboardStore((s) => s.updatePageWidth);
  const editorSnapEnabled = useUIStore((s) => s.editorSnapEnabled);
  const pageWidth = dashboard.pageWidth ?? PAGE_WIDTH_DEFAULT;
  const pageHeight = pageContentHeight(dashboard);

  // ── Multi-selection ────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Canvas pan offset (in screen px, applied outside zoom) ─────────────
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });

  // ── Zoom state ─────────────────────────────────────────────────────────
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);

  // Keep zoom ref in sync with state
  useEffect(() => {
    zoomRef.current = zoom;
    onZoomChange?.(zoom);
  }, [zoom, onZoomChange]);

  // Auto-fit zoom when page width changes (initial fit)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const avail = entry.contentRect.width - 48;
      const s = Math.min(1, Math.max(0.25, avail / pageWidth));
      zoomRef.current = s;
      setZoom(s);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [pageWidth]);

  // ── Space-key tracking (for pan mode) ──────────────────────────────────
  const spaceDownRef = useRef(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        // Only pan if not typing in an input or contenteditable (e.g. CodeMirror)
        const tag = document.activeElement?.tagName ?? "";
        const isEditable = tag === "INPUT" || tag === "TEXTAREA" || !!(document.activeElement as HTMLElement)?.isContentEditable;
        if (!isEditable) {
          spaceDownRef.current = true;
          e.preventDefault();
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceDownRef.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // ── Snap guide lines ────────────────────────────────────────────────────
  const [guideLines, setGuideLines] = useState<GuideLine[]>([]);

  // ── Drag/resize state ──────────────────────────────────────────────────
  const dragRef = useRef<DragState | null>(null);
  const livePosRef = useRef<Record<string, CanvasPosition>>({});
  const [livePositions, setLivePositions] = useState<Record<string, CanvasPosition>>({});

  // ── Marquee selection state ────────────────────────────────────────────
  const [marquee, setMarquee] = useState<MarqueeState | null>(null);
  const marqueeRef = useRef<MarqueeState | null>(null);

  // ── Pan drag state ─────────────────────────────────────────────────────
  const panDragRef = useRef<{ startX: number; startY: number; origPan: { x: number; y: number } } | null>(null);

  // ── Page-resize live width ─────────────────────────────────────────────
  const [livePageWidth, setLivePageWidth] = useState<number | null>(null);
  const pageResizeRef = useRef<{ startX: number; origWidth: number } | null>(null);

  // Compute snap lines from all other panels + page edges
  const computeSnapLines = useCallback((
    draggingIds: Set<string>,
    livePos: Record<string, CanvasPosition>,
  ) => {
    if (!editorSnapEnabled) return;
    const pw = livePageWidth ?? pageWidth;
    const ph = pageContentHeight(dashboard);

    // Candidate lines from non-dragged panels + page frame
    const xLines: number[] = [0, pw, pw / 2];
    const yLines: number[] = [0, ph, ph / 2];

    dashboard.panels.forEach((p, i) => {
      if (draggingIds.has(p.id)) return;
      const pos = livePos[p.id] ?? getPos(dashboard, p.id, i);
      xLines.push(pos.x, pos.x + pos.w, pos.x + pos.w / 2);
      yLines.push(pos.y, pos.y + pos.h, pos.y + pos.h / 2);
    });

    return { xLines, yLines };
  }, [dashboard, editorSnapEnabled, livePageWidth, pageWidth]);

  /** Try to snap a value to the nearest line. Returns snapped value + guide line or null. */
  const trySnap = (value: number, lines: number[]): { snapped: number; guide: number } | null => {
    let best: { snapped: number; guide: number } | null = null;
    for (const line of lines) {
      const dist = Math.abs(value - line);
      if (dist <= SNAP_THRESHOLD && (!best || dist < Math.abs(best.snapped - best.guide))) {
        best = { snapped: line, guide: line };
      }
    }
    return best;
  };

  const handleDragStart = useCallback(
    (e: React.MouseEvent, panel: Panel, index: number, shiftKey: boolean) => {
      if (activeTool !== "select") return;
      e.preventDefault();
      e.stopPropagation();

      // Update selection
      if (shiftKey) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(panel.id)) next.delete(panel.id);
          else next.add(panel.id);
          return next;
        });
        onSelectElement(panel.id);
      } else {
        if (!selectedIds.has(panel.id)) {
          setSelectedIds(new Set([panel.id]));
          onSelectElement(panel.id);
        }
      }

      const origPos = getPos(dashboard, panel.id, index);

      // Collect original positions of all currently-selected panels (for multi-move)
      const allOrigPos: Record<string, CanvasPosition> = {};
      const dragSet = shiftKey
        ? new Set([...Array.from(selectedIds), panel.id])
        : (selectedIds.has(panel.id) ? new Set(selectedIds) : new Set([panel.id]));

      dragSet.forEach((id) => {
        const idx = dashboard.panels.findIndex((p) => p.id === id);
        if (idx >= 0) {
          allOrigPos[id] = getPos(dashboard, id, idx);
        }
      });

      dragRef.current = {
        type: "move",
        id: panel.id,
        startX: e.clientX,
        startY: e.clientY,
        origPos,
        allOrigPos,
      };
    },
    [activeTool, dashboard, selectedIds, onSelectElement],
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

  // Stable global mouse move/up handler
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const s = zoomRef.current;

      // ── Pan ────────────────────────────────────────────────────────────
      if (panDragRef.current) {
        const dx = e.clientX - panDragRef.current.startX;
        const dy = e.clientY - panDragRef.current.startY;
        const newPan = {
          x: panDragRef.current.origPan.x + dx,
          y: panDragRef.current.origPan.y + dy,
        };
        panRef.current = newPan;
        setPan(newPan);
        return;
      }

      // ── Marquee selection ──────────────────────────────────────────────
      if (marqueeRef.current) {
        const el = scrollContainerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cur = {
          ...marqueeRef.current,
          currentX: e.clientX - rect.left,
          currentY: e.clientY - rect.top,
        };
        marqueeRef.current = cur;
        setMarquee({ ...cur });
        return;
      }

      // ── Page resize ────────────────────────────────────────────────────
      if (pageResizeRef.current) {
        const dx = (e.clientX - pageResizeRef.current.startX) / s;
        const newWidth = Math.max(320, pageResizeRef.current.origWidth + dx);
        setLivePageWidth(Math.round(newWidth));
        return;
      }

      // ── Panel drag/resize ──────────────────────────────────────────────
      const drag = dragRef.current;
      if (!drag) return;

      const dx = (e.clientX - drag.startX) / s;
      const dy = (e.clientY - drag.startY) / s;
      const orig = drag.origPos;

      const draggingIds = new Set(Object.keys(drag.allOrigPos ?? { [drag.id]: true }));
      const snapLines = computeSnapLines(draggingIds, livePosRef.current);
      const newGuides: GuideLine[] = [];

      if (drag.type === "move") {
        const newPositions: Record<string, CanvasPosition> = {};

        // Compute snapped position for the primary panel, apply same delta to all
        let rawX = Math.max(0, orig.x + dx);
        let rawY = Math.max(0, orig.y + dy);

        if (snapLines && editorSnapEnabled) {
          const snapX = trySnap(rawX, snapLines.xLines) ??
            trySnap(rawX + orig.w, snapLines.xLines);
          if (snapX) {
            // Check if we snapped the left or right edge
            if (Math.abs(rawX - snapX.snapped) <= SNAP_THRESHOLD) {
              rawX = snapX.snapped;
            } else {
              rawX = snapX.snapped - orig.w;
            }
            newGuides.push({ axis: "x", position: snapX.guide });
          }
          const snapY = trySnap(rawY, snapLines.yLines) ??
            trySnap(rawY + orig.h, snapLines.yLines);
          if (snapY) {
            if (Math.abs(rawY - snapY.snapped) <= SNAP_THRESHOLD) {
              rawY = snapY.snapped;
            } else {
              rawY = snapY.snapped - orig.h;
            }
            newGuides.push({ axis: "y", position: snapY.guide });
          }
        }

        const deltaX = rawX - orig.x;
        const deltaY = rawY - orig.y;

        if (drag.allOrigPos) {
          for (const [id, aOrig] of Object.entries(drag.allOrigPos)) {
            newPositions[id] = {
              ...aOrig,
              x: Math.max(0, aOrig.x + deltaX),
              y: Math.max(0, aOrig.y + deltaY),
            };
          }
        } else {
          newPositions[drag.id] = { ...orig, x: rawX, y: rawY };
        }

        livePosRef.current = { ...livePosRef.current, ...newPositions };
      } else {
        // Resize
        const corner = drag.corner ?? "se";
        let { x, y, w, h } = orig;
        if (corner.includes("e")) w = Math.max(80, orig.w + dx);
        if (corner.includes("s")) h = Math.max(60, orig.h + dy);
        if (corner.includes("w")) { x = orig.x + dx; w = Math.max(80, orig.w - dx); }
        if (corner.includes("n")) { y = orig.y + dy; h = Math.max(60, orig.h - dy); }
        livePosRef.current = { ...livePosRef.current, [drag.id]: { x, y, w, h } };
      }

      setGuideLines(newGuides);
      setLivePositions({ ...livePosRef.current });
    };

    const onUp = (_e: MouseEvent) => {
      // ── End pan ────────────────────────────────────────────────────────
      if (panDragRef.current) {
        panDragRef.current = null;
        return;
      }

      // ── End marquee ────────────────────────────────────────────────────
      if (marqueeRef.current) {
        const m = marqueeRef.current;
        marqueeRef.current = null;
        setMarquee(null);

        // Compute canvas coords from screen coords
        const el = scrollContainerRef.current;
        if (!el) return;

        // The page frame is offset by pan + scroll. Approximate by reading scrollLeft/scrollTop.
        const scrollLeft = el.scrollLeft;
        const scrollTop = el.scrollTop;

        // The page frame starts at 24px padding (in zoomed coords) + pan
        const pageOffsetX = 24 + panRef.current.x - scrollLeft;
        const pageOffsetY = 24 + panRef.current.y - scrollTop;

        const s = zoomRef.current;
        const rx1 = Math.min(m.startX, m.currentX);
        const ry1 = Math.min(m.startY, m.currentY);
        const rx2 = Math.max(m.startX, m.currentX);
        const ry2 = Math.max(m.startY, m.currentY);

        // Convert screen marquee to dashboard coords
        const mX1 = (rx1 - pageOffsetX) / s;
        const mY1 = (ry1 - pageOffsetY) / s;
        const mX2 = (rx2 - pageOffsetX) / s;
        const mY2 = (ry2 - pageOffsetY) / s;

        const hit = new Set<string>();
        dashboard.panels.forEach((p, i) => {
          const pos = getPos(dashboard, p.id, i);
          if (
            pos.x < mX2 && pos.x + pos.w > mX1 &&
            pos.y < mY2 && pos.y + pos.h > mY1
          ) {
            hit.add(p.id);
          }
        });

        if (hit.size > 0) {
          setSelectedIds((prev) => {
            const next = new Set([...prev, ...hit]);
            return next;
          });
          const first = hit.values().next().value;
          if (first) onSelectElement(first);
        }
        return;
      }

      // ── End page resize ────────────────────────────────────────────────
      if (pageResizeRef.current && livePageWidth !== null) {
        updatePageWidth(dashboardId, livePageWidth);
        pageResizeRef.current = null;
        setLivePageWidth(null);
        return;
      }

      // ── End panel drag/resize ──────────────────────────────────────────
      const drag = dragRef.current;
      if (!drag) return;
      setGuideLines([]);

      if (drag.type === "move" && drag.allOrigPos) {
        // Commit all moved panels
        for (const id of Object.keys(drag.allOrigPos)) {
          const finalPos = livePosRef.current[id];
          if (finalPos) updateCanvasPosition(dashboardId, id, finalPos);
        }
      } else {
        const finalPos = livePosRef.current[drag.id];
        if (finalPos) updateCanvasPosition(dashboardId, drag.id, finalPos);
      }

      dragRef.current = null;
      // Clear live positions that were just committed
      if (drag.allOrigPos) {
        const next = { ...livePosRef.current };
        for (const id of Object.keys(drag.allOrigPos)) delete next[id];
        livePosRef.current = next;
      } else {
        delete livePosRef.current[drag.id];
      }
      setLivePositions({ ...livePosRef.current });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardId, updateCanvasPosition, updatePageWidth, editorSnapEnabled, dashboard, livePageWidth, computeSnapLines, onSelectElement]);

  // ── Scroll-wheel zoom ──────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || spaceDownRef.current) return; // let browser handle ctrl+scroll (pinch) naturally
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      const next = Math.min(2, Math.max(0.25, zoomRef.current + delta));
      zoomRef.current = next;
      setZoom(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Space+drag = pan
    if (spaceDownRef.current || e.button === 1) {
      e.preventDefault();
      panDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origPan: { ...panRef.current },
      };
      return;
    }

    if (e.target !== e.currentTarget && (e.target as HTMLElement).closest("[data-panel]")) return;

    if (activeTool !== "select") {
      onAddPanel(activeTool);
      return;
    }

    // Start marquee selection on empty canvas
    if (e.target === e.currentTarget) {
      onSelectElement(null);
      if (!e.shiftKey) setSelectedIds(new Set());

      const el = scrollContainerRef.current!;
      const rect = el.getBoundingClientRect();
      const start = {
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
        currentX: e.clientX - rect.left,
        currentY: e.clientY - rect.top,
      };
      marqueeRef.current = start;
      setMarquee(start);
    }
  };

  const handlePageFrameClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectElement(null);
      if (!e.shiftKey) setSelectedIds(new Set());
    }
  };

  // ── Computed values ────────────────────────────────────────────────────
  const currentPageWidth = livePageWidth ?? pageWidth;

  // Multi-select bounding box
  const multiSelectPositions = selectedIds.size > 1
    ? Array.from(selectedIds).map((id) => {
        const idx = dashboard.panels.findIndex((p) => p.id === id);
        return livePositions[id] ?? getPos(dashboard, id, idx);
      }).filter(Boolean)
    : [];
  const multiBBox = multiSelectPositions.length > 1 ? getBoundingBox(multiSelectPositions) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <Ruler width={currentPageWidth + 80} />

      {/* Infinite canvas */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflow: "auto",
          background: "var(--color-background-tertiary)",
          backgroundImage:
            "radial-gradient(circle, var(--color-border-tertiary) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          padding: 24,
          cursor: spaceDownRef.current
            ? "grab"
            : activeTool !== "select"
            ? "crosshair"
            : "default",
          position: "relative",
        }}
        onMouseDown={handleCanvasMouseDown}
      >
        {/* Pan + scale wrapper */}
        <div style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: "0 0",
          position: "relative",
          width: "fit-content",
          margin: "0 auto",
        }}>
          {/* Zoom wrapper (CSS zoom keeps layout stable) */}
          <div style={{ position: "relative", margin: "0 auto", width: "fit-content", zoom: zoom }}>
            {/* Page label */}
            <div
              style={{
                fontSize: 10,
                color: "var(--color-muted-foreground)",
                marginBottom: 6,
                fontFamily: "var(--font-mono)",
              }}
            >
              {dashboard.name} · {currentPageWidth}px
            </div>

            {/* Page white rectangle */}
            <div
              style={{
                position: "relative",
                width: currentPageWidth,
                minHeight: pageHeight,
                background: "var(--color-background-primary)",
                border: "1px solid var(--color-border-secondary)",
                borderRadius: 4,
                overflow: "visible",
              }}
              onClick={handlePageFrameClick}
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
                const isSelected = selectedId === panel.id || selectedIds.has(panel.id);
                return (
                  <div key={panel.id} data-panel={panel.id}>
                    <CanvasElement
                      panel={panel}
                      pos={pos}
                      selected={isSelected}
                      result={queryResults.get(panel.id) ?? null}
                      loading={loadingPanels.has(panel.id)}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleDragStart(e, panel, index, e.shiftKey);
                      }}
                      onResizeStart={(e, corner) => handleResizeStart(e, panel, index, corner)}
                    />
                  </div>
                );
              })}

              {/* Multi-selection bounding box overlay */}
              {multiBBox && (
                <div
                  style={{
                    position: "absolute",
                    left: multiBBox.x - 2,
                    top: multiBBox.y - 2,
                    width: multiBBox.w + 4,
                    height: multiBBox.h + 4,
                    border: `1.5px dashed ${SELECTION_BLUE}`,
                    borderRadius: 4,
                    pointerEvents: "none",
                    zIndex: 9999,
                  }}
                />
              )}

              {/* Snap guide lines */}
              {guideLines.map((g, i) => (
                g.axis === "x" ? (
                  <div key={i} style={{
                    position: "absolute",
                    left: g.position,
                    top: 0,
                    width: 1,
                    height: "100%",
                    background: "var(--color-primary)",
                    opacity: 0.8,
                    pointerEvents: "none",
                    zIndex: 9998,
                  }} />
                ) : (
                  <div key={i} style={{
                    position: "absolute",
                    top: g.position,
                    left: 0,
                    height: 1,
                    width: "100%",
                    background: "var(--color-primary)",
                    opacity: 0.8,
                    pointerEvents: "none",
                    zIndex: 9998,
                  }} />
                )
              ))}
            </div>

            {/* Page-resize handle dot */}
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
                zIndex: 100,
              }}
              title={livePageWidth ? `${livePageWidth}px` : "Drag to resize page width"}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                pageResizeRef.current = {
                  startX: e.clientX,
                  origWidth: currentPageWidth,
                };
              }}
            />

            {/* Live width tooltip */}
            {livePageWidth !== null && (
              <div
                style={{
                  position: "absolute",
                  bottom: -24,
                  right: 0,
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-text-primary)",
                  background: "var(--color-background-secondary)",
                  border: "0.5px solid var(--color-border-secondary)",
                  borderRadius: 4,
                  padding: "2px 6px",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {livePageWidth}px
              </div>
            )}
          </div>
        </div>

        {/* Marquee selection rect (screen-space overlay) */}
        {marquee && (
          <div
            style={{
              position: "absolute",
              left: Math.min(marquee.startX, marquee.currentX),
              top: Math.min(marquee.startY, marquee.currentY),
              width: Math.abs(marquee.currentX - marquee.startX),
              height: Math.abs(marquee.currentY - marquee.startY),
              border: `1px solid ${SELECTION_BLUE}`,
              background: `${SELECTION_BLUE}20`,
              pointerEvents: "none",
              zIndex: 9999,
            }}
          />
        )}
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Exported helper for align operations ──────────────────────────────────────

export type AlignOperation =
  | "align-left" | "align-right" | "align-top" | "align-bottom"
  | "center-x" | "center-y"
  | "distribute-x" | "distribute-y";

/** Compute new canvas positions after an alignment operation.
 *  Returns a map of panelId → new CanvasPosition. */
export function computeAlignedPositions(
  panelIds: string[],
  positions: Record<string, CanvasPosition>,
  op: AlignOperation,
  _pageWidth?: number,
  _pageHeight?: number,
): Record<string, CanvasPosition> {
  if (!panelIds.length) return {};

  const posArray = panelIds.map((id) => ({ id, pos: positions[id] })).filter((x) => x.pos);
  if (!posArray.length) return {};

  const bbox = getBoundingBox(posArray.map((x) => x.pos));
  if (!bbox) return {};

  const result: Record<string, CanvasPosition> = {};

  switch (op) {
    case "align-left":
      for (const { id, pos } of posArray) result[id] = { ...pos, x: bbox.x };
      break;
    case "align-right": {
      const rightEdge = bbox.x + bbox.w;
      for (const { id, pos } of posArray) result[id] = { ...pos, x: rightEdge - pos.w };
      break;
    }
    case "align-top":
      for (const { id, pos } of posArray) result[id] = { ...pos, y: bbox.y };
      break;
    case "align-bottom": {
      const bottomEdge = bbox.y + bbox.h;
      for (const { id, pos } of posArray) result[id] = { ...pos, y: bottomEdge - pos.h };
      break;
    }
    case "center-x": {
      const cx = bbox.x + bbox.w / 2;
      for (const { id, pos } of posArray) result[id] = { ...pos, x: cx - pos.w / 2 };
      break;
    }
    case "center-y": {
      const cy = bbox.y + bbox.h / 2;
      for (const { id, pos } of posArray) result[id] = { ...pos, y: cy - pos.h / 2 };
      break;
    }
    case "distribute-x": {
      if (posArray.length < 3) break;
      const sorted = [...posArray].sort((a, b) => a.pos.x - b.pos.x);
      const totalW = sorted.reduce((sum, { pos }) => sum + pos.w, 0);
      const gap = (bbox.w - totalW) / (sorted.length - 1);
      let curX = bbox.x;
      for (const { id, pos } of sorted) {
        result[id] = { ...pos, x: curX };
        curX += pos.w + gap;
      }
      break;
    }
    case "distribute-y": {
      if (posArray.length < 3) break;
      const sorted = [...posArray].sort((a, b) => a.pos.y - b.pos.y);
      const totalH = sorted.reduce((sum, { pos }) => sum + pos.h, 0);
      const gap = (bbox.h - totalH) / (sorted.length - 1);
      let curY = bbox.y;
      for (const { id, pos } of sorted) {
        result[id] = { ...pos, y: curY };
        curY += pos.h + gap;
      }
      break;
    }
  }

  return result;
}
