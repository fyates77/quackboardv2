import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { indexedDBStorage } from "./storage";
import { createId } from "@/lib/id";
import type { DataSource, FileFormat } from "@/types/data-source";
import type { ColumnInfo } from "@/engine/types";

interface DataSourceState {
  dataSources: Record<string, DataSource>;

  addDataSource: (params: {
    name: string;
    tableName: string;
    fileName: string;
    format: FileFormat;
    sizeBytes: number;
    columns: ColumnInfo[];
    storageKey: string;
  }) => string;

  removeDataSource: (id: string) => void;
}

export const useDataSourceStore = create<DataSourceState>()(
  persist(
    (set) => ({
      dataSources: {},

      addDataSource: (params) => {
        const id = createId();
        const ds: DataSource = {
          id,
          ...params,
          rowCount: null,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          dataSources: { ...state.dataSources, [id]: ds },
        }));
        return id;
      },

      removeDataSource: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.dataSources;
          return { dataSources: rest };
        }),
    }),
    {
      name: "quackboard-datasources",
      storage: createJSONStorage(() => indexedDBStorage),
    },
  ),
);
