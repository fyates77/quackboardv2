import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useInteractionStore } from "@/stores/interaction-store";
import { useEngine } from "@/engine/use-engine";
import { useAutoRunPanels } from "@/hooks/use-auto-run-panels";
import { applyFilters, applyCrossFilters, applyDrilldownFilters } from "@/lib/sql-template";
import { queryCache } from "@/lib/query-cache";
import { EditorShell } from "@/components/editor/editor-shell";
import type { EditorTool, RailTab, RightTab } from "@/components/editor/editor-shell";
import type { QueryResult } from "@/engine/types";

export const Route = createFileRoute("/dashboards/$dashboardId")({
  component: DashboardEditorPage,
});

function DashboardEditorPage() {
  const { dashboardId } = Route.useParams();
  const dashboard = useDashboardStore((s) => s.dashboards[dashboardId]);
  const addPanel = useDashboardStore((s) => s.addPanel);
  const updatePanel = useDashboardStore((s) => s.updatePanel);

  const parameterValues = useInteractionStore((s) => s.parameterValues);
  const crossFilters = useInteractionStore((s) => s.crossFilters);
  const drilldownStacks = useInteractionStore((s) => s.drilldownStacks);
  const engine = useEngine();

  // ── Editor UI state ──────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<EditorTool>("select");
  const [activeRailTab, setActiveRailTab] = useState<RailTab>("layers");
  const [activeRightTab, setActiveRightTab] = useState<RightTab>("design");
  const [previewMode, setPreviewMode] = useState(false);

  // ── Query state ──────────────────────────────────────────────────────────
  const [queryResults, setQueryResults] = useState<Map<string, QueryResult>>(() => new Map());
  const [loadingPanels, setLoadingPanels] = useState<Set<string>>(() => new Set());
  const [filterValues] = useState<Record<string, string>>({});

  const handleQueryResult = useCallback((panelId: string, result: QueryResult | null) => {
    setQueryResults((prev) => {
      const next = new Map(prev);
      if (result) next.set(panelId, result);
      else next.delete(panelId);
      return next;
    });
  }, []);

  const handleLoadingChange = useCallback((panelId: string, loading: boolean) => {
    setLoadingPanels((prev) => {
      const next = new Set(prev);
      if (loading) next.add(panelId);
      else next.delete(panelId);
      return next;
    });
  }, []);

  // Auto-run all panel queries on load
  useAutoRunPanels(engine, dashboard?.panels ?? [], handleQueryResult, handleLoadingChange);

  // Re-run on param / cross-filter / drilldown changes
  const panelsRef = useRef(dashboard?.panels ?? []);
  panelsRef.current = dashboard?.panels ?? [];
  const filterValuesRef = useRef(filterValues);
  filterValuesRef.current = filterValues;
  const filtersRef = useRef(dashboard?.filters ?? []);
  filtersRef.current = dashboard?.filters ?? [];
  const paramValuesRef = useRef(parameterValues);
  paramValuesRef.current = parameterValues;
  const crossFiltersRef = useRef(crossFilters);
  crossFiltersRef.current = crossFilters;
  const drilldownStacksRef = useRef(drilldownStacks);
  drilldownStacksRef.current = drilldownStacks;

  const prevParamKeyRef = useRef(JSON.stringify(parameterValues));
  const prevCrossFilterKeyRef = useRef(JSON.stringify(crossFilters));
  const prevDrilldownKeyRef = useRef(JSON.stringify(drilldownStacks));

  const paramKey = JSON.stringify(parameterValues);
  const crossFilterKey = JSON.stringify(crossFilters);
  const drilldownKey = JSON.stringify(drilldownStacks);

  useEffect(() => {
    if (paramKey === prevParamKeyRef.current) return;
    prevParamKeyRef.current = paramKey;
    const panels = panelsRef.current.filter((p) => p.query.sql.trim() && p.applyDashboardFilters !== false);
    if (!panels.length) return;
    let cancelled = false;
    (async () => {
      for (const panel of panels) {
        if (cancelled) break;
        const sql = applyFilters(panel.query.sql, filtersRef.current, filterValuesRef.current, paramValuesRef.current);
        const cached = queryCache.get(sql);
        if (cached) { handleQueryResult(panel.id, cached); continue; }
        handleLoadingChange(panel.id, true);
        try {
          const result = await engine.executeQuery(sql);
          if (!cancelled) { queryCache.set(sql, result); handleQueryResult(panel.id, result); }
        } catch { /* skip */ } finally { handleLoadingChange(panel.id, false); }
      }
    })();
    return () => { cancelled = true; };
  }, [paramKey, engine, handleQueryResult, handleLoadingChange]);

  useEffect(() => {
    if (crossFilterKey === prevCrossFilterKeyRef.current) return;
    prevCrossFilterKeyRef.current = crossFilterKey;
    const currentCF = Object.values(crossFiltersRef.current);
    const panels = panelsRef.current.filter((p) => p.query.sql.trim() && !currentCF.some((cf) => cf.sourcePanelId === p.id));
    if (!panels.length) return;
    let cancelled = false;
    (async () => {
      for (const panel of panels) {
        if (cancelled) break;
        let sql = panel.applyDashboardFilters !== false
          ? applyFilters(panel.query.sql, filtersRef.current, filterValuesRef.current, paramValuesRef.current)
          : panel.query.sql;
        sql = applyCrossFilters(sql, currentCF, panel.crossFilterListenColumns);
        const cached = queryCache.get(sql);
        if (cached) { handleQueryResult(panel.id, cached); continue; }
        handleLoadingChange(panel.id, true);
        try {
          const result = await engine.executeQuery(sql);
          if (!cancelled) { queryCache.set(sql, result); handleQueryResult(panel.id, result); }
        } catch { /* skip */ } finally { handleLoadingChange(panel.id, false); }
      }
    })();
    return () => { cancelled = true; };
  }, [crossFilterKey, engine, handleQueryResult, handleLoadingChange]);

  useEffect(() => {
    if (drilldownKey === prevDrilldownKeyRef.current) return;
    prevDrilldownKeyRef.current = drilldownKey;
    const panels = panelsRef.current;
    let cancelled = false;
    (async () => {
      for (const panel of panels) {
        if (cancelled) break;
        const stack = drilldownStacksRef.current[panel.id];
        if (!stack?.length || !panel.query.sql.trim()) continue;
        let sql = panel.applyDashboardFilters !== false
          ? applyFilters(panel.query.sql, filtersRef.current, filterValuesRef.current, paramValuesRef.current)
          : panel.query.sql;
        sql = applyDrilldownFilters(sql, stack);
        const cached = queryCache.get(sql);
        if (cached) { handleQueryResult(panel.id, cached); continue; }
        handleLoadingChange(panel.id, true);
        try {
          const result = await engine.executeQuery(sql);
          if (!cancelled) { queryCache.set(sql, result); handleQueryResult(panel.id, result); }
        } catch { /* skip */ } finally { handleLoadingChange(panel.id, false); }
      }
    })();
    return () => { cancelled = true; };
  }, [drilldownKey, engine, handleQueryResult, handleLoadingChange]);

  // Re-run when panel SQL changes (e.g. builder config updates)
  const prevSqlMapRef = useRef<Record<string, string>>({});
  const sqlKey = (dashboard?.panels ?? []).map((p) => `${p.id}:${p.query.sql}`).join("|");
  useEffect(() => {
    const panels = panelsRef.current;
    const changed = panels.filter((p) => {
      const prev = prevSqlMapRef.current[p.id];
      // undefined means panel is new — treat as changed so first SQL assignment runs
      return p.query.sql.trim() && prev !== p.query.sql;
    });
    // Update tracking for all current panels
    for (const p of panels) prevSqlMapRef.current[p.id] = p.query.sql;
    if (!changed.length) return;
    let cancelled = false;
    (async () => {
      for (const panel of changed) {
        if (cancelled) break;
        const sql = panel.applyDashboardFilters !== false
          ? applyFilters(panel.query.sql, filtersRef.current, filterValuesRef.current, paramValuesRef.current)
          : panel.query.sql;
        handleLoadingChange(panel.id, true);
        try {
          const result = await engine.executeQuery(sql);
          if (!cancelled) { queryCache.set(sql, result); handleQueryResult(panel.id, result); }
        } catch { /* skip */ } finally { handleLoadingChange(panel.id, false); }
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sqlKey, engine, handleQueryResult, handleLoadingChange]);

  // Initialize SQL tracking on first render (panels already loaded)
  useEffect(() => {
    for (const p of panelsRef.current) {
      if (prevSqlMapRef.current[p.id] === undefined) {
        prevSqlMapRef.current[p.id] = p.query.sql;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
      if (e.key === "v" && !e.metaKey && !e.ctrlKey) setActiveTool("select");
      if (e.key === "f" && !e.metaKey && !e.ctrlKey) setActiveTool("frame");
      if (e.key === "t" && !e.metaKey && !e.ctrlKey) setActiveTool("text");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleAddPanel = useCallback(
    (type?: string) => {
      const newId = addPanel(dashboardId);
      if (type && type !== "select" && type !== "section") {
        updatePanel(dashboardId, newId, {
          visualization: {
            type: type as never,
            mapping: {},
            options: {},
          },
        });
      }
      setSelectedId(newId);
      setActiveTool("select");
    },
    [dashboardId, addPanel, updatePanel],
  );

  if (!dashboard) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-background)",
          color: "var(--color-muted-foreground)",
          fontSize: 14,
        }}
      >
        Dashboard not found
      </div>
    );
  }

  return (
    <EditorShell
      dashboardId={dashboardId}
      dashboard={dashboard}
      selectedId={selectedId}
      onSelectElement={setSelectedId}
      activeTool={activeTool}
      onToolChange={setActiveTool}
      activeRailTab={activeRailTab}
      onRailTabChange={setActiveRailTab}
      activeRightTab={activeRightTab}
      onRightTabChange={setActiveRightTab}
      previewMode={previewMode}
      onPreviewToggle={() => setPreviewMode((v) => !v)}
      queryResults={queryResults}
      loadingPanels={loadingPanels}
      onAddPanel={handleAddPanel}
      onQueryResult={handleQueryResult}
    />
  );
}
