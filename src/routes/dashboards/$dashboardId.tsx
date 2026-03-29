import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useUIStore } from "@/stores/ui-store";
import { useEngine } from "@/engine/use-engine";
import { useAutoRunPanels } from "@/hooks/use-auto-run-panels";
import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar";
import { DashboardCanvas } from "@/components/dashboard/dashboard-canvas";
import { PanelEditor } from "@/components/dashboard/panel-editor";
import { Button } from "@/components/ui/button";
import type { QueryResult } from "@/engine/types";

export const Route = createFileRoute("/dashboards/$dashboardId")({
  component: DashboardEditorPage,
});

function DashboardEditorPage() {
  const { dashboardId } = Route.useParams();
  const dashboard = useDashboardStore((s) => s.dashboards[dashboardId]);
  const addPanel = useDashboardStore((s) => s.addPanel);
  const { activePanelId, setActivePanelId } = useUIStore();
  const engine = useEngine();

  const [queryResults, setQueryResults] = useState<Map<string, QueryResult>>(
    () => new Map(),
  );
  const [loadingPanels, setLoadingPanels] = useState<Set<string>>(
    () => new Set(),
  );

  const handleQueryResult = useCallback(
    (panelId: string, result: QueryResult | null) => {
      setQueryResults((prev) => {
        const next = new Map(prev);
        if (result) {
          next.set(panelId, result);
        } else {
          next.delete(panelId);
        }
        return next;
      });
    },
    [],
  );

  const handleLoadingChange = useCallback(
    (panelId: string, loading: boolean) => {
      setLoadingPanels((prev) => {
        const next = new Set(prev);
        if (loading) {
          next.add(panelId);
        } else {
          next.delete(panelId);
        }
        return next;
      });
    },
    [],
  );

  // Auto-execute all panel queries when the dashboard first loads
  useAutoRunPanels(
    engine,
    dashboard?.panels ?? [],
    handleQueryResult,
    handleLoadingChange,
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Escape: close panel editor
      if (e.key === "Escape" && activePanelId) {
        setActivePanelId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activePanelId, setActivePanelId]);

  if (!dashboard) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Dashboard not found</p>
      </div>
    );
  }

  const activePanel = activePanelId
    ? dashboard.panels.find((p) => p.id === activePanelId)
    : null;

  return (
    <div className="flex h-full flex-col">
      <DashboardToolbar dashboard={dashboard} />

      <div className="flex flex-1 overflow-hidden">
        {/* Main canvas area */}
        <div className="flex-1 overflow-auto">
          {dashboard.panels.length === 0 ? (
            <div className="glass flex h-full items-center justify-center rounded-xl border-2 border-dashed border-border/40">
              <div className="text-center">
                <p className="text-lg font-medium">Empty dashboard</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a panel to start building your dashboard
                </p>
                <Button
                  className="mt-4"
                  onClick={() => addPanel(dashboardId)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Panel
                </Button>
              </div>
            </div>
          ) : (
            <DashboardCanvas
              dashboardId={dashboardId}
              queryResults={queryResults}
              loadingPanels={loadingPanels}
            />
          )}
        </div>

        {/* Panel editor sidebar */}
        {activePanel && (
          <div className="w-80 shrink-0">
            <PanelEditor
              key={activePanel.id}
              dashboardId={dashboardId}
              panel={activePanel}
              onQueryResult={handleQueryResult}
            />
          </div>
        )}
      </div>
    </div>
  );
}
