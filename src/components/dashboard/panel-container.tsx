import { useState } from "react";
import { GripVertical, Pencil, Trash2, X, Check } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { ChartRenderer } from "@/components/visualizations/chart-renderer";
import { cn } from "@/lib/utils";
import type { Panel } from "@/types/dashboard";
import type { QueryResult } from "@/engine/types";

interface PanelContainerProps {
  dashboardId: string;
  panel: Panel;
  queryResult: QueryResult | null;
}

export function PanelContainer({
  dashboardId,
  panel,
  queryResult,
}: PanelContainerProps) {
  const removePanel = useDashboardStore((s) => s.removePanel);
  const updatePanelTitle = useDashboardStore((s) => s.updatePanelTitle);
  const { activePanelId, setActivePanelId } = useUIStore();
  const isActive = activePanelId === panel.id;

  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(panel.title);

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
        "flex h-full flex-col rounded-lg border bg-card shadow-sm transition-shadow",
        isActive && "ring-2 ring-primary",
      )}
      onClick={() => setActivePanelId(panel.id)}
    >
      {/* Header */}
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
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
              className="flex-1 rounded border bg-background px-1.5 py-0.5 text-sm font-medium outline-none focus:ring-1 focus:ring-ring"
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

      {/* Content area */}
      <div className="flex-1 overflow-hidden p-2">
        {queryResult ? (
          <ChartRenderer result={queryResult} config={panel.visualization} />
        ) : panel.query.sql ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Click Run in the editor to execute query
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Select this panel to write a query
          </div>
        )}
      </div>
    </div>
  );
}
