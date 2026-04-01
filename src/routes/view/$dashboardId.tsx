import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useInteractionStore } from "@/stores/interaction-store";
import { useEngine } from "@/engine/use-engine";
import { useAutoRunPanels } from "@/hooks/use-auto-run-panels";
import { applyFilters, applyCrossFilters, applyDrilldownFilters } from "@/lib/sql-template";
import { queryCache } from "@/lib/query-cache";
import { DashboardCanvas } from "@/components/dashboard/dashboard-canvas";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ParameterBar } from "@/components/dashboard/parameter-bar";
import { TabBar } from "@/components/dashboard/tab-bar";
import { SiteHeader } from "@/components/dashboard/site-header";
import type { QueryResult } from "@/engine/types";

export const Route = createFileRoute("/view/$dashboardId")({
  component: DashboardViewPage,
});

function DashboardViewPage() {
  const { dashboardId } = Route.useParams();
  const dashboard = useDashboardStore((s) => s.dashboards[dashboardId]);
  const parameterValues = useInteractionStore((s) => s.parameterValues);
  const crossFilters = useInteractionStore((s) => s.crossFilters);
  const setCrossFilter = useInteractionStore((s) => s.setCrossFilter);
  const clearCrossFilters = useInteractionStore((s) => s.clearCrossFilters);
  const drilldownStacks = useInteractionStore((s) => s.drilldownStacks);
  const pushDrilldown = useInteractionStore((s) => s.pushDrilldown);
  const activeTabId = useInteractionStore((s) => s.activeTabs[dashboardId]);
  const engine = useEngine();

  const [queryResults, setQueryResults] = useState<Map<string, QueryResult>>(() => new Map());
  const [loadingPanels, setLoadingPanels] = useState<Set<string>>(() => new Set());
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

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

  useAutoRunPanels(engine, dashboard?.panels ?? [], handleQueryResult, handleLoadingChange);

  const prevFilterKeyRef = useRef(JSON.stringify(filterValues));
  const prevParamKeyRef = useRef(JSON.stringify(parameterValues));
  const panelsRef = useRef(dashboard?.panels ?? []);
  panelsRef.current = dashboard?.panels ?? [];
  const filterValuesRef = useRef(filterValues);
  filterValuesRef.current = filterValues;
  const filtersRef = useRef(dashboard?.filters ?? []);
  filtersRef.current = dashboard?.filters ?? [];
  const paramValuesRef = useRef(parameterValues);
  paramValuesRef.current = parameterValues;

  const filterKey = JSON.stringify(filterValues);
  const paramKey = JSON.stringify(parameterValues);

  useEffect(() => {
    const filterChanged = filterKey !== prevFilterKeyRef.current;
    const paramChanged = paramKey !== prevParamKeyRef.current;
    if (!filterChanged && !paramChanged) return;
    prevFilterKeyRef.current = filterKey;
    prevParamKeyRef.current = paramKey;

    const panels = panelsRef.current;
    const panelsWithSql = panels.filter((p) => p.query.sql.trim() && p.applyDashboardFilters !== false);
    if (panelsWithSql.length === 0) return;

    let cancelled = false;
    (async () => {
      for (const panel of panelsWithSql) {
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
  }, [filterKey, paramKey, engine, handleQueryResult, handleLoadingChange]);

  const crossFilterKey = JSON.stringify(crossFilters);
  const prevCrossFilterKeyRef = useRef(crossFilterKey);
  const crossFiltersRef = useRef(crossFilters);
  crossFiltersRef.current = crossFilters;

  useEffect(() => {
    if (crossFilterKey === prevCrossFilterKeyRef.current) return;
    prevCrossFilterKeyRef.current = crossFilterKey;

    const panels = panelsRef.current;
    const currentCrossFilters = Object.values(crossFiltersRef.current);
    const panelsToRerun = panels.filter((p) => p.query.sql.trim() && !currentCrossFilters.some((cf) => cf.sourcePanelId === p.id));
    let cancelled = false;
    (async () => {
      for (const panel of panelsToRerun) {
        if (cancelled) break;
        let sql = panel.applyDashboardFilters !== false
          ? applyFilters(panel.query.sql, filtersRef.current, filterValuesRef.current, paramValuesRef.current)
          : panel.query.sql;
        sql = applyCrossFilters(sql, currentCrossFilters, panel.crossFilterListenColumns);
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

  const drilldownKey = JSON.stringify(drilldownStacks);
  const prevDrilldownKeyRef = useRef(drilldownKey);
  const drilldownStacksRef = useRef(drilldownStacks);
  drilldownStacksRef.current = drilldownStacks;

  useEffect(() => {
    if (drilldownKey === prevDrilldownKeyRef.current) return;
    prevDrilldownKeyRef.current = drilldownKey;

    const panels = panelsRef.current;
    const currentStacks = drilldownStacksRef.current;
    let cancelled = false;
    (async () => {
      for (const panel of panels) {
        if (cancelled) break;
        const stack = currentStacks[panel.id];
        if (!stack || stack.length === 0) continue;
        if (!panel.query.sql.trim()) continue;
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

  const handleClickDatum = useCallback(
    (panelId: string, datum: { column: string; value: unknown }) => {
      const panel = dashboard?.panels.find((p) => p.id === panelId);
      if (!panel) return;
      if (panel.drilldownLevels && panel.drilldownLevels.length > 0) {
        const stack = drilldownStacks[panelId] ?? [];
        if (stack.length < panel.drilldownLevels.length) {
          const column = panel.drilldownLevels[stack.length];
          pushDrilldown(panelId, { level: stack.length, column, value: String(datum.value), label: `${column}: ${datum.value}` });
          return;
        }
      }
      if (panel.crossFilterEnabled) {
        setCrossFilter(panelId, datum.column, datum.value as string | number);
      }
    },
    [dashboard?.panels, drilldownStacks, pushDrilldown, setCrossFilter],
  );

  const handleFilterChange = useCallback((name: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  if (!dashboard) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Dashboard not found</p>
      </div>
    );
  }

  const tabs = dashboard.tabs ?? [];
  const activeTab = tabs.length > 0 ? tabs.find((t) => t.id === activeTabId) ?? tabs[0] : null;
  const visiblePanelIds = activeTab ? new Set(activeTab.panelIds) : null;

  const filteredPanels = (visiblePanelIds
    ? dashboard.panels.filter((p) => visiblePanelIds.has(p.id))
    : dashboard.panels
  ).filter((panel) => {
    if (!panel.visibilityCondition) return true;
    const cond = panel.visibilityCondition;
    if (cond.type === "always") return true;
    if (cond.type === "filter" && cond.filterName) return !!filterValues[cond.filterName];
    if (cond.type === "query") {
      const result = queryResults.get(panel.id);
      return !result || result.rowCount > 0;
    }
    return true;
  });

  const theme = dashboard.theme;
  const themeStyle: Record<string, string> = {};
  if (theme?.accentColor) themeStyle["--color-primary"] = theme.accentColor;
  if (theme?.fontFamily) themeStyle["fontFamily"] = theme.fontFamily;
  if (theme?.canvasBackground) themeStyle["background"] = theme.canvasBackground;

  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      id={`dashboard-view-${dashboardId}`}
      style={themeStyle as React.CSSProperties}
    >
      {theme?.customCSS && (
        <style>{`#dashboard-view-${dashboardId} { ${theme.customCSS} }`}</style>
      )}

      {dashboard.siteHeader && (
        <SiteHeader header={dashboard.siteHeader} dashboardName={dashboard.name} updatedAt={dashboard.updatedAt} />
      )}

      <FilterBar
        dashboardId={dashboardId}
        filters={dashboard.filters ?? []}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
      />

      {Object.keys(crossFilters).length > 0 && (
        <div className="flex items-center gap-2 px-4 py-1.5 text-xs bg-primary/5 border-b border-border/30">
          <span className="font-medium text-primary">Cross-filters:</span>
          {Object.values(crossFilters).map((cf) => (
            <span key={`${cf.sourcePanelId}:${cf.column}`} className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
              {cf.column} = {String(cf.value)}
            </span>
          ))}
          <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors underline" onClick={() => clearCrossFilters()}>
            Clear all
          </button>
        </div>
      )}

      <ParameterBar parameters={dashboard.parameters ?? []} />

      {tabs.length > 0 && <TabBar dashboardId={dashboardId} tabs={tabs} />}

      <div className="flex-1 overflow-auto p-4">
        <DashboardCanvas
          dashboardId={dashboardId}
          queryResults={queryResults}
          loadingPanels={loadingPanels}
          visiblePanelIds={visiblePanelIds ?? undefined}
          allResults={queryResults}
          onClickDatum={handleClickDatum}
          spacingMultiplier={theme?.spacingMultiplier}
          layoutMode={dashboard.layoutMode}
          readOnly
          filteredPanels={filteredPanels}
        />
      </div>
    </div>
  );
}
