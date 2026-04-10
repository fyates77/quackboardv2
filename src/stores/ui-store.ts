import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { indexedDBStorage } from "./storage";

interface UIState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
  activePanelId: string | null;

  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  setActivePanelId: (id: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "light",
      sidebarOpen: true,
      activePanelId: null,

      setTheme: (theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        set({ theme });
      },

      toggleTheme: () =>
        set((state) => {
          const next = state.theme === "light" ? "dark" : "light";
          document.documentElement.classList.toggle("dark", next === "dark");
          return { theme: next };
        }),

      setActivePanelId: (id) => set({ activePanelId: id }),
    }),
    {
      name: "quackboard-ui",
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.theme === "dark") {
          document.documentElement.classList.add("dark");
        }
      },
    },
  ),
);
