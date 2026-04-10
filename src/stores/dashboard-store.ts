import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { indexedDBStorage } from "./storage";
import { createId } from "@/lib/id";
import type {
  Dashboard,
  DashboardFilter,
  DashboardParameter,
  DashboardTab,
  DashboardTheme,
  SiteHeader,
  Panel,
  PanelStyle,
  LayoutItem,
  VisualizationConfig,
  CanvasPosition,
} from "@/types/dashboard";

interface DashboardState {
  dashboards: Record<string, Dashboard>;
  activeDashboardId: string | null;

  createDashboard: (name: string, description?: string) => string;
  duplicateDashboard: (id: string) => string | null;
  deleteDashboard: (id: string) => void;
  renameDashboard: (id: string, name: string) => void;
  updateDashboardDescription: (id: string, description: string) => void;
  setActiveDashboard: (id: string | null) => void;

  addPanel: (dashboardId: string) => string;
  duplicatePanel: (dashboardId: string, panelId: string) => string | null;
  removePanel: (dashboardId: string, panelId: string) => void;
  updatePanelTitle: (
    dashboardId: string,
    panelId: string,
    title: string,
  ) => void;
  updatePanelQuery: (
    dashboardId: string,
    panelId: string,
    sql: string,
  ) => void;
  updatePanelBuilderConfig: (
    dashboardId: string,
    panelId: string,
    config: import("@/types/builder").BuilderConfig,
    generatedSql: string,
  ) => void;
  setPanelQueryMode: (
    dashboardId: string,
    panelId: string,
    mode: "builder" | "sql",
  ) => void;
  updatePanelApplyFilters: (
    dashboardId: string,
    panelId: string,
    apply: boolean,
  ) => void;
  updatePanelVisualization: (
    dashboardId: string,
    panelId: string,
    config: Partial<VisualizationConfig>,
  ) => void;
  updateLayout: (dashboardId: string, layout: LayoutItem[]) => void;

  addFilter: (dashboardId: string, filter: DashboardFilter) => void;
  updateFilter: (
    dashboardId: string,
    filterId: string,
    updates: Partial<DashboardFilter>,
  ) => void;
  removeFilter: (dashboardId: string, filterId: string) => void;

  updatePanel: (
    dashboardId: string,
    panelId: string,
    updates: Partial<Panel>,
  ) => void;

  // Parameters
  addParameter: (dashboardId: string, param: DashboardParameter) => void;
  updateParameter: (
    dashboardId: string,
    paramId: string,
    updates: Partial<DashboardParameter>,
  ) => void;
  removeParameter: (dashboardId: string, paramId: string) => void;

  // Tabs
  setTabs: (dashboardId: string, tabs: DashboardTab[]) => void;

  // Panel style
  updatePanelStyle: (
    dashboardId: string,
    panelId: string,
    style: Partial<PanelStyle>,
  ) => void;

  // Dashboard theme
  updateDashboardTheme: (
    dashboardId: string,
    theme: Partial<DashboardTheme>,
  ) => void;

  // Layout mode
  setLayoutMode: (dashboardId: string, mode: "grid" | "scroll") => void;

  // Site header
  updateSiteHeader: (dashboardId: string, header: Partial<SiteHeader>) => void;

  // Canvas editor
  updateCanvasPosition: (dashboardId: string, panelId: string, pos: CanvasPosition) => void;
  setPageWidth: (dashboardId: string, width: number) => void;

  // Create dashboard with pre-filled data (for templates)
  createDashboardWithData: (data: Omit<Dashboard, "id" | "createdAt" | "updatedAt">) => string;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      dashboards: {},
      activeDashboardId: null,

      createDashboard: (name, description = "") => {
        const id = createId();
        const now = new Date().toISOString();
        const dashboard: Dashboard = {
          id,
          name,
          description,
          createdAt: now,
          updatedAt: now,
          panels: [],
          layout: [],
          filters: [],
          settings: { refreshInterval: null, defaultDataSourceId: null },
        };
        set((state) => ({
          dashboards: { ...state.dashboards, [id]: dashboard },
        }));
        return id;
      },

      duplicateDashboard: (id) => {
        const newId = createId();
        let created = false;
        set((state) => {
          const dash = state.dashboards[id];
          if (!dash) return state;
          const now = new Date().toISOString();
          const newPanels = dash.panels.map((p) => ({
            ...p,
            id: createId(),
          }));
          const idMap = new Map(
            dash.panels.map((p, i) => [p.id, newPanels[i].id]),
          );
          const newLayout = dash.layout.map((l) => ({
            ...l,
            i: idMap.get(l.i) ?? l.i,
          }));
          created = true;
          const newFilters = (dash.filters ?? []).map((f) => ({
            ...f,
            id: createId(),
          }));
          return {
            dashboards: {
              ...state.dashboards,
              [newId]: {
                ...dash,
                id: newId,
                name: `${dash.name} (copy)`,
                createdAt: now,
                updatedAt: now,
                panels: newPanels,
                layout: newLayout,
                filters: newFilters,
              },
            },
          };
        });
        return created ? newId : null;
      },

      deleteDashboard: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.dashboards;
          return {
            dashboards: rest,
            activeDashboardId:
              state.activeDashboardId === id
                ? null
                : state.activeDashboardId,
          };
        }),

      renameDashboard: (id, name) =>
        set((state) => {
          const dash = state.dashboards[id];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [id]: { ...dash, name, updatedAt: new Date().toISOString() },
            },
          };
        }),

      updateDashboardDescription: (id, description) =>
        set((state) => {
          const dash = state.dashboards[id];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [id]: {
                ...dash,
                description,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      setActiveDashboard: (id) => set({ activeDashboardId: id }),

      addPanel: (dashboardId) => {
        const panelId = createId();
        const panel: Panel = {
          id: panelId,
          title: "New Panel",
          query: { sql: "", dataSourceId: null },
          visualization: {
            type: "table",
            mapping: {},
            options: {},
          },
        };
        const layoutItem: LayoutItem = {
          i: panelId,
          x: 0,
          y: Infinity,
          w: 6,
          h: 4,
          minW: 2,
          minH: 2,
        };
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                panels: [...dash.panels, panel],
                layout: [...dash.layout, layoutItem],
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
        return panelId;
      },

      duplicatePanel: (dashboardId, panelId) => {
        const newPanelId = createId();
        let created = false;
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          const srcPanel = dash.panels.find((p) => p.id === panelId);
          const srcLayout = dash.layout.find((l) => l.i === panelId);
          if (!srcPanel) return state;
          created = true;
          const newPanel: Panel = {
            ...srcPanel,
            id: newPanelId,
            title: `${srcPanel.title} (copy)`,
          };
          const newLayoutItem: LayoutItem = {
            i: newPanelId,
            x: srcLayout?.x ?? 0,
            y: Infinity,
            w: srcLayout?.w ?? 6,
            h: srcLayout?.h ?? 4,
            minW: srcLayout?.minW ?? 2,
            minH: srcLayout?.minH ?? 2,
          };
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                panels: [...dash.panels, newPanel],
                layout: [...dash.layout, newLayoutItem],
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
        return created ? newPanelId : null;
      },

      removePanel: (dashboardId, panelId) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                panels: dash.panels.filter((p) => p.id !== panelId),
                layout: dash.layout.filter((l) => l.i !== panelId),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      updatePanelTitle: (dashboardId, panelId, title) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                panels: dash.panels.map((p) =>
                  p.id === panelId ? { ...p, title } : p,
                ),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      updatePanelQuery: (dashboardId, panelId, sql) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                panels: dash.panels.map((p) =>
                  p.id === panelId
                    ? { ...p, query: { ...p.query, sql } }
                    : p,
                ),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      updatePanelBuilderConfig: (dashboardId, panelId, config, generatedSql) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                panels: dash.panels.map((p) =>
                  p.id === panelId
                    ? { ...p, query: { ...p.query, sql: generatedSql, mode: "builder" as const, builderConfig: config } }
                    : p,
                ),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      setPanelQueryMode: (dashboardId, panelId, mode) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                panels: dash.panels.map((p) =>
                  p.id === panelId
                    ? { ...p, query: { ...p.query, mode } }
                    : p,
                ),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      updatePanelApplyFilters: (dashboardId, panelId, apply) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                panels: dash.panels.map((p) =>
                  p.id === panelId
                    ? { ...p, applyDashboardFilters: apply }
                    : p,
                ),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      updatePanelVisualization: (dashboardId, panelId, config) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                panels: dash.panels.map((p) =>
                  p.id === panelId
                    ? {
                        ...p,
                        visualization: { ...p.visualization, ...config },
                      }
                    : p,
                ),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      updateLayout: (dashboardId, layout) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                layout,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      addFilter: (dashboardId, filter) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                filters: [...(dash.filters ?? []), filter],
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      updateFilter: (dashboardId, filterId, updates) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                filters: (dash.filters ?? []).map((f) =>
                  f.id === filterId ? { ...f, ...updates } : f,
                ),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      removeFilter: (dashboardId, filterId) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                filters: (dash.filters ?? []).filter(
                  (f) => f.id !== filterId,
                ),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      updatePanel: (dashboardId, panelId, updates) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                panels: dash.panels.map((p) =>
                  p.id === panelId ? { ...p, ...updates } : p,
                ),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      addParameter: (dashboardId, param) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                parameters: [...(dash.parameters ?? []), param],
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      updateParameter: (dashboardId, paramId, updates) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                parameters: (dash.parameters ?? []).map((p) =>
                  p.id === paramId ? { ...p, ...updates } : p,
                ),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      removeParameter: (dashboardId, paramId) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                parameters: (dash.parameters ?? []).filter(
                  (p) => p.id !== paramId,
                ),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      updatePanelStyle: (dashboardId, panelId, style) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                panels: dash.panels.map((p) =>
                  p.id === panelId
                    ? { ...p, style: { ...p.style, ...style } }
                    : p,
                ),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      updateDashboardTheme: (dashboardId, theme) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                theme: { ...dash.theme, ...theme },
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      setTabs: (dashboardId, tabs) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                tabs,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      setLayoutMode: (dashboardId, mode) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                layoutMode: mode,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      updateSiteHeader: (dashboardId, header) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                siteHeader: { ...dash.siteHeader, ...header },
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      updateCanvasPosition: (dashboardId, panelId, pos) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                canvasPositions: { ...dash.canvasPositions, [panelId]: pos },
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      setPageWidth: (dashboardId, width) =>
        set((state) => {
          const dash = state.dashboards[dashboardId];
          if (!dash) return state;
          return {
            dashboards: {
              ...state.dashboards,
              [dashboardId]: {
                ...dash,
                pageWidth: width,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      createDashboardWithData: (data) => {
        const id = createId();
        const now = new Date().toISOString();
        const dashboard: Dashboard = {
          ...data,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          dashboards: { ...state.dashboards, [id]: dashboard },
        }));
        return id;
      },
    }),
    {
      name: "quackboard-dashboards",
      storage: createJSONStorage(() => indexedDBStorage),
    },
  ),
);
