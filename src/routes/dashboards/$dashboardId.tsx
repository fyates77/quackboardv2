import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useUIStore } from "@/stores/ui-store";
import { useEngine } from "@/engine/use-engine";
import { useAutoRunPanels } from "@/hooks/use-auto-run-panels";
import { interpolateFilters } from "@/lib/sql-template";
import { queryCache } from "@/lib/query-cache";
import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar";
import { DashboardCanvas } from "@/components/dashboard/dashboard-canvas";
import { FilterBar } from "@/components/dashboard/filter-bar";
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
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

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

  // Re-run panels when filter values change.
  // Use a ref for the previous key so we don't re-trigger the effect via state.
  const prevFilterKeyRef = useRef(JSON.stringify(filterValues));
  // Keep latest refs so the effect closure always sees current values
  const panelsRef = useRef(dashboard?.panels ?? []);
  panelsRef.current = dashboard?.panels ?? [];
  const filterValuesRef = useRef(filterValues);
  filterValuesRef.current = filterValues;

  const filterKey = JSON.stringify(filterValues);

  useEffect(() => {
    if (filterKey === prevFilterKeyRef.current) return;
    prevFilterKeyRef.current = filterKey;

    const panels = panelsRef.current;
    const currentFilters = filterValuesRef.current;
    const panelsWithSql = panels.filter(
      (p) => p.query.sql.trim() && p.applyDashboardFilters !== false,
    );
    if (panelsWithSql.length === 0) return;

    let cancelled = false;

    (async () => {
      for (const panel of panelsWithSql) {
        if (cancelled) break;
        const sql = interpolateFilters(panel.query.sql, currentFilters);

        const cached = queryCache.get(sql);
        if (cached) {
          handleQueryResult(panel.id, cached);
          continue;
        }

        handleLoadingChange(panel.id, true);
        try {
          const result = await engine.executeQuery(sql);
          if (!cancelled) {
            queryCache.set(sql, result);
            handleQueryResult(panel.id, result);
          }
        } catch {
          // Skip failures silently on filter change
        } finally {
          if (!cancelled) handleLoadingChange(panel.id, false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filterKey, engine, handleQueryResult, handleLoadingChange]);

  const handleDuplicatePanel = useCallback(
    (sourcePanelId: string, newPanelId: string) => {
      const sourceResult = queryResults.get(sourcePanelId);
      if (sourceResult) {
        handleQueryResult(newPanelId, sourceResult);
      }
    },
    [queryResults, handleQueryResult],
  );

  const handleFilterChange = useCallback(
    (name: string, value: string) => {
      setFilterValues((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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

      <FilterBar
        dashboardId={dashboardId}
        filters={dashboard.filters ?? []}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
      />

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
              onDuplicatePanel={handleDuplicatePanel}
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
              filterValues={filterValues}
              onQueryResult={handleQueryResult}
            />
          </div>
        )}
      </div>
    </div>
  );
}
