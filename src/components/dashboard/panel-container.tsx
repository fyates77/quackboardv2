import { useState } from "react";
import {
  GripVertical,
  Pencil,
  Trash2,
  Copy,
  X,
  Check,
  Loader2,
  TableProperties,
} from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useUIStore } from "@/stores/ui-store";
import { useInteractionStore } from "@/stores/interaction-store";
import { Button } from "@/components/ui/button";
import { ChartRenderer } from "@/components/visualizations/chart-renderer";
import { DrilldownBreadcrumb } from "./drilldown/drilldown-breadcrumb";
import { DrillDrawer } from "./drilldown/drill-drawer";
import { RecordDetail } from "./drilldown/record-detail";
import { cn } from "@/lib/utils";
import type { Panel } from "@/types/dashboard";
import type { QueryResult } from "@/engine/types";

/** Panel types that don't need a SQL query to render */
const CONTENT_PANEL_TYPES = new Set(["markdown", "image", "embed", "html"]);

interface PanelContainerProps {
  dashboardId: string;
  panel: Panel;
  queryResult: QueryResult | null;
  loading?: boolean;
  onDuplicate?: (sourcePanelId: string, newPanelId: string) => void;
  allResults?: Map<string, QueryResult>;
}

export function PanelContainer({
  dashboardId,
  panel,
  queryResult,
  loading,
  onDuplicate,
  allResults,
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

  const isContentPanel = CONTENT_PANEL_TYPES.has(panel.visualization.type);

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

  return (
    <div
      className={cn(
        "glass flex h-full flex-col rounded-xl transition-all",
        isActive && "ring-2 ring-primary/60 shadow-lg",
        !isActive && "hover:shadow-md",
      )}
      onClick={() => setActivePanelId(panel.id)}
    >
      {/* Header */}
      <div className="flex items-center gap-1 border-b border-border/30 px-2 py-1.5">
        <div className="panel-drag-handle cursor-grab active:cursor-grabbing p-0.5">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {editing ? (
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
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
            >
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
              className="flex-1 truncate text-sm font-medium cursor-pointer"
              onDoubleClick={() => setEditing(true)}
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
      </div>

      {/* Drilldown breadcrumb */}
      {panel.drilldownLevels && panel.drilldownLevels.length > 0 && (
        <DrilldownBreadcrumb panelId={panel.id} />
      )}

      {/* Content area */}
      <div className="relative flex-1 overflow-hidden p-2">
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
          />
        ) : queryResult ? (
          <ChartRenderer
            result={queryResult}
            config={panel.visualization}
            panel={panel}
            allResults={allResults}
          />
        ) : panel.query.sql ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Loading...
          </div>
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
