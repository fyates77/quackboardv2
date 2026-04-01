import { useRef, useState, useMemo, useCallback, type CSSProperties } from "react";
import {
  GripVertical,
  Pencil,
  Trash2,
  Copy,
  X,
  Check,
  Loader2,
  TableProperties,
  Camera,
  ClipboardCopy,
} from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useUIStore } from "@/stores/ui-store";
import { useInteractionStore } from "@/stores/interaction-store";
import { Button } from "@/components/ui/button";
import { ChartRenderer, type ClickDatum } from "@/components/visualizations/chart-renderer";
import { DrilldownBreadcrumb } from "./drilldown/drilldown-breadcrumb";
import { DrillDrawer } from "./drilldown/drill-drawer";
import { RecordDetail } from "./drilldown/record-detail";
import { cn } from "@/lib/utils";
import type { Panel, PanelStyle } from "@/types/dashboard";
import type { QueryResult } from "@/engine/types";

/** Panel types that don't need a SQL query to render */
const CONTENT_PANEL_TYPES = new Set(["markdown", "image", "embed", "html", "nav-bar"]);

const SHADOW_MAP: Record<string, string> = {
  none: "none",
  sm: "0 1px 3px rgba(0,0,0,0.08)",
  md: "0 4px 12px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)",
  lg: "0 10px 30px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)",
};

function panelStyleToCSS(style?: PanelStyle): {
  className: string;
  css: CSSProperties;
} {
  if (!style || Object.keys(style).length === 0) {
    return { className: "glass", css: {} };
  }

  const css: CSSProperties = {};
  let useGlass = true;

  if (style.background) {
    useGlass = false;
    css.background = style.background;
    if (style.backgroundOpacity !== undefined) {
      css.opacity = style.backgroundOpacity;
    }
  }

  if (style.borderColor) {
    css.borderColor = style.borderColor;
    css.borderStyle = "solid";
  }
  if (style.borderWidth !== undefined) {
    css.borderWidth = style.borderWidth;
    if (!style.borderColor) css.borderStyle = "solid";
  }
  if (style.borderRadius !== undefined) {
    css.borderRadius = style.borderRadius;
  }
  if (style.padding !== undefined) {
    // Applied to content area, not the outer container
  }
  if (style.shadow && style.shadow !== "md") {
    css.boxShadow = SHADOW_MAP[style.shadow] ?? undefined;
  }

  return { className: useGlass ? "glass" : "", css };
}

interface PanelContainerProps {
  dashboardId: string;
  panel: Panel;
  queryResult: QueryResult | null;
  loading?: boolean;
  onDuplicate?: (sourcePanelId: string, newPanelId: string) => void;
  allResults?: Map<string, QueryResult>;
  onClickDatum?: (panelId: string, datum: ClickDatum) => void;
  /** Consumer view — hide edit/delete/drag controls */
  readOnly?: boolean;
}

export function PanelContainer({
  dashboardId,
  panel,
  queryResult,
  loading,
  onDuplicate,
  allResults,
  onClickDatum,
  readOnly = false,
}: PanelContainerProps) {
  const removePanel = useDashboardStore((s) => s.removePanel);
  const duplicatePanel = useDashboardStore((s) => s.duplicatePanel);
  const updatePanelTitle = useDashboardStore((s) => s.updatePanelTitle);
  const { activePanelId, setActivePanelId } = useUIStore();
  const setDataDrawerPanelId = useInteractionStore(
    (s) => s.setDataDrawerPanelId,
  );
  const dataDrawerPanelId = useInteractionStore((s) => s.dataDrawerPanelId);
  const isActive = activePanelId === panel.id;

  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(panel.title);
  const contentRef = useRef<HTMLDivElement>(null);

  const isContentPanel = CONTENT_PANEL_TYPES.has(panel.visualization.type);

  // Export chart as PNG (SVG → Canvas → PNG)
  const handleExportPng = useCallback(async () => {
    const el = contentRef.current;
    if (!el) return;
    const svg = el.querySelector("svg");
    if (!svg) return;

    const svgString = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svg.clientWidth * 2;
      canvas.height = svg.clientHeight * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(pngBlob);
        a.download = `${panel.title || "chart"}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, "image/png");
    };
    img.src = url;
  }, [panel.title]);

  // Copy results to clipboard as CSV
  const handleCopyToClipboard = useCallback(() => {
    if (!queryResult) return;
    const header = queryResult.columns.map((c) => c.name).join("\t");
    const rows = queryResult.rows.map((row) =>
      queryResult.columns.map((c) => String(row[c.name] ?? "")).join("\t"),
    );
    const text = [header, ...rows].join("\n");
    navigator.clipboard.writeText(text);
  }, [queryResult]);

  // Conditional visibility check
  if (panel.visibilityCondition) {
    const cond = panel.visibilityCondition;
    if (cond.type === "filter" && cond.filterName) {
      // We don't have filterValues here, so visibility is handled by the parent
      // This is a placeholder — actual filtering happens in the dashboard editor
    }
    if (cond.type === "query" && queryResult && queryResult.rowCount === 0) {
      return null;
    }
  }

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== panel.title) {
      updatePanelTitle(dashboardId, panel.id, trimmed);
    } else {
      setTitleDraft(panel.title);
    }
    setEditing(false);
  };

  const { className: styleClass, css: styleCss } = useMemo(
    () => panelStyleToCSS(panel.style),
    [panel.style],
  );

  const handleChartClick = useMemo(() => {
    if (!onClickDatum) return undefined;
    return (datum: ClickDatum) => onClickDatum(panel.id, datum);
  }, [onClickDatum, panel.id]);

  const contentPadding = panel.style?.padding !== undefined ? panel.style.padding : 8;

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl transition-all",
        styleClass,
        isActive && "ring-2 ring-primary/60 shadow-lg",
        !isActive && !panel.style?.shadow && "hover:shadow-md",
      )}
      style={styleCss}
      onClick={() => setActivePanelId(panel.id)}
    >
      {/* Header (hidden if chromeless) */}
      {!panel.style?.chromeless && (
      <div className="flex items-center gap-1 border-b border-border/30 px-2 py-1.5">
        {!readOnly && (
          <div className="panel-drag-handle cursor-grab active:cursor-grabbing p-0.5">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {!readOnly && editing ? (
          <form
            className="flex flex-1 items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              commitTitle();
            }}
          >
            <input
              autoFocus
              className="flex-1 rounded-md border border-border/50 bg-background/60 px-1.5 py-0.5 text-sm font-medium outline-none backdrop-blur-sm focus:ring-1 focus:ring-ring"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setTitleDraft(panel.title);
                  setEditing(false);
                }
              }}
            />
            <Button type="submit" variant="ghost" size="icon" className="h-6 w-6">
              <Check className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                setTitleDraft(panel.title);
                setEditing(false);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </form>
        ) : (
          <>
            <span
              className="flex-1 truncate text-sm font-medium"
              style={{
                textAlign: panel.style?.titleAlign,
                fontSize: panel.style?.titleSize ? `${panel.style.titleSize}px` : undefined,
                cursor: readOnly ? "default" : "pointer",
              }}
              onDoubleClick={readOnly ? undefined : () => setEditing(true)}
            >
              {panel.title}
            </span>

            {/* Show data drawer button for data panels */}
            {!isContentPanel && queryResult && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="View underlying data"
                onClick={(e) => {
                  e.stopPropagation();
                  setDataDrawerPanelId(
                    dataDrawerPanelId === panel.id ? null : panel.id,
                  );
                }}
              >
                <TableProperties className="h-3 w-3" />
              </Button>
            )}

            {/* Export as PNG (for chart panels) */}
            {!isContentPanel && queryResult && panel.visualization.type !== "table" && panel.visualization.type !== "kpi" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="Export as PNG"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExportPng();
                }}
              >
                <Camera className="h-3 w-3" />
              </Button>
            )}

            {/* Copy to clipboard */}
            {!isContentPanel && queryResult && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="Copy data to clipboard"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyToClipboard();
                }}
              >
                <ClipboardCopy className="h-3 w-3" />
              </Button>
            )}

            {/* Edit controls — hidden in read-only mode */}
            {!readOnly && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(true);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  title="Duplicate panel"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newId = duplicatePanel(dashboardId, panel.id);
                    if (newId && onDuplicate) onDuplicate(panel.id, newId);
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePanel(dashboardId, panel.id);
                    if (isActive) setActivePanelId(null);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </>
        )}
      </div>
      )}

      {/* Invisible drag handle for chromeless panels */}
      {panel.style?.chromeless && (
        <div className="panel-drag-handle absolute top-0 left-0 right-0 h-3 cursor-grab active:cursor-grabbing z-10" />
      )}

      {/* Drilldown breadcrumb */}
      {panel.drilldownLevels && panel.drilldownLevels.length > 0 && (
        <DrilldownBreadcrumb panelId={panel.id} />
      )}

      {/* Content area */}
      <div ref={contentRef} className="relative flex-1 overflow-hidden" style={{ padding: contentPadding }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/60 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {isContentPanel ? (
          <ChartRenderer
            result={queryResult ?? { columns: [], rows: [], rowCount: 0, elapsed: 0 }}
            config={panel.visualization}
            panel={panel}
            allResults={allResults}
            dashboardId={dashboardId}
          />
        ) : queryResult ? (
          <ChartRenderer
            result={queryResult}
            config={panel.visualization}
            panel={panel}
            allResults={allResults}
            onClickDatum={handleChartClick}
            dashboardId={dashboardId}
          />
        ) : panel.query.sql ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Loading...
          </div>
        ) : panel.visualization.type === "custom" ? (
          // Custom panels render even with no SQL — data is optional
          <ChartRenderer
            result={{ columns: [], rows: [], rowCount: 0, elapsed: 0 }}
            config={panel.visualization}
            panel={panel}
            allResults={allResults}
            dashboardId={dashboardId}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Select this panel to write a query
          </div>
        )}

        {/* Data drawer overlay */}
        <DrillDrawer
          panelId={panel.id}
          panelTitle={panel.title}
          result={queryResult}
          sql={panel.query.sql}
          showQuery={panel.showQueryToConsumer}
        />

        {/* Record detail overlay */}
        {queryResult && (
          <RecordDetail
            result={queryResult}
            fields={panel.recordFields}
          />
        )}
      </div>
    </div>
  );
}
