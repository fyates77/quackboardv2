import type { QueryEngine } from "./types";
import { useDataSourceStore } from "@/stores/data-source-store";
import { loadBlob } from "@/lib/blob-storage";

export async function rehydrateDataSources(
  engine: QueryEngine,
): Promise<void> {
  const dataSources = useDataSourceStore.getState().dataSources;
  const removeDataSource = useDataSourceStore.getState().removeDataSource;

  for (const ds of Object.values(dataSources)) {
    const buffer = await loadBlob(ds.storageKey);
    if (!buffer) {
      // Blob is missing from IndexedDB -- remove stale data source entry
      removeDataSource(ds.id);
      continue;
    }

    try {
      await engine.registerDataSource({
        tableName: ds.tableName,
        fileName: ds.fileName,
        format: ds.format,
        buffer,
      });
    } catch (e) {
      console.warn(`Failed to rehydrate table "${ds.tableName}":`, e);
      removeDataSource(ds.id);
    }
  }
}
