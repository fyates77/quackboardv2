import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { indexedDBStorage } from "./storage";
import { createId } from "@/lib/id";
import type {
  Dashboard,
  Panel,
  LayoutItem,
  VisualizationConfig,
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
  updatePanelVisualization: (
    dashboardId: string,
    panelId: string,
    config: Partial<VisualizationConfig>,
  ) => void;
  updateLayout: (dashboardId: string, layout: LayoutItem[]) => void;
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
    }),
    {
      name: "quackboard-dashboards",
      storage: createJSONStorage(() => indexedDBStorage),
    },
  ),
);
