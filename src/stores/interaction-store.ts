import { create } from "zustand";

interface DrilldownEntry {
  level: number;
  column: string;
  value: string;
  label: string;
}

interface InteractionState {
  // Drilldown: panelId -> stack of breadcrumb entries
  drilldownStacks: Record<string, DrilldownEntry[]>;
  pushDrilldown: (panelId: string, entry: DrilldownEntry) => void;
  popDrilldownTo: (panelId: string, level: number) => void;
  resetDrilldown: (panelId: string) => void;

  // Parameters: paramName -> current value
  parameterValues: Record<string, string | number | boolean>;
  setParameterValue: (name: string, value: string | number | boolean) => void;
  setParameterValues: (
    values: Record<string, string | number | boolean>,
  ) => void;

  // Tabs: dashboardId -> active tab id
  activeTabs: Record<string, string>;
  setActiveTab: (dashboardId: string, tabId: string) => void;

  // Data drawer: which panel has its data drawer open
  dataDrawerPanelId: string | null;
  setDataDrawerPanelId: (panelId: string | null) => void;

  // Record detail: which panel + row index is showing record detail
  recordDetail: { panelId: string; rowIndex: number } | null;
  setRecordDetail: (
    detail: { panelId: string; rowIndex: number } | null,
  ) => void;

  // Search palette open state
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

export const useInteractionStore = create<InteractionState>()((set) => ({
  // Drilldown
  drilldownStacks: {},

  pushDrilldown: (panelId, entry) =>
    set((state) => ({
      drilldownStacks: {
        ...state.drilldownStacks,
        [panelId]: [...(state.drilldownStacks[panelId] ?? []), entry],
      },
    })),

  popDrilldownTo: (panelId, level) =>
    set((state) => ({
      drilldownStacks: {
        ...state.drilldownStacks,
        [panelId]: (state.drilldownStacks[panelId] ?? []).filter(
          (e) => e.level <= level,
        ),
      },
    })),

  resetDrilldown: (panelId) =>
    set((state) => ({
      drilldownStacks: {
        ...state.drilldownStacks,
        [panelId]: [],
      },
    })),

  // Parameters
  parameterValues: {},

  setParameterValue: (name, value) =>
    set((state) => ({
      parameterValues: {
        ...state.parameterValues,
        [name]: value,
      },
    })),

  setParameterValues: (values) =>
    set((state) => ({
      parameterValues: {
        ...state.parameterValues,
        ...values,
      },
    })),

  // Tabs
  activeTabs: {},

  setActiveTab: (dashboardId, tabId) =>
    set((state) => ({
      activeTabs: {
        ...state.activeTabs,
        [dashboardId]: tabId,
      },
    })),

  // Data drawer
  dataDrawerPanelId: null,

  setDataDrawerPanelId: (panelId) => set({ dataDrawerPanelId: panelId }),

  // Record detail
  recordDetail: null,

  setRecordDetail: (detail) => set({ recordDetail: detail }),

  // Search palette
  searchOpen: false,

  setSearchOpen: (open) => set({ searchOpen: open }),
}));
