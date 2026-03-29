import { useState } from "react";
import { Trash2, Eye, EyeOff } from "lucide-react";
import { useDataSourceStore } from "@/stores/data-source-store";
import { useEngine } from "@/engine/use-engine";
import { deleteBlob } from "@/lib/blob-storage";
import { formatBytes } from "@/lib/file-utils";
import { Button } from "@/components/ui/button";
import { DataSourcePreview } from "./data-source-preview";

export function DataSourceList() {
  const dataSources = useDataSourceStore((s) => s.dataSources);
  const removeDataSource = useDataSourceStore((s) => s.removeDataSource);
  const engine = useEngine();
  const [previewId, setPreviewId] = useState<string | null>(null);

  const dsList = Object.values(dataSources).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  if (dsList.length === 0) return null;

  const handleDelete = async (id: string) => {
    const ds = dataSources[id];
    if (!ds) return;
    try {
      await engine.unregisterDataSource(ds.tableName);
    } catch {
      // table might not exist if engine restarted
    }
    await deleteBlob(ds.storageKey);
    removeDataSource(id);
    if (previewId === id) setPreviewId(null);
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Loaded Tables</h2>
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">Name</th>
              <th className="p-3 text-left font-medium">Table</th>
              <th className="p-3 text-left font-medium">Format</th>
              <th className="p-3 text-left font-medium">Size</th>
              <th className="p-3 text-left font-medium">Columns</th>
              <th className="p-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dsList.map((ds) => (
              <tr key={ds.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{ds.name}</td>
                <td className="p-3">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {ds.tableName}
                  </code>
                </td>
                <td className="p-3 uppercase text-xs">{ds.format}</td>
                <td className="p-3 text-xs">{formatBytes(ds.sizeBytes)}</td>
                <td className="p-3 text-xs">{ds.columns.length}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        setPreviewId(previewId === ds.id ? null : ds.id)
                      }
                    >
                      {previewId === ds.id ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(ds.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewId && dataSources[previewId] && (
        <div>
          <h3 className="mb-2 text-sm font-medium">
            Preview: {dataSources[previewId].tableName}
          </h3>
          <DataSourcePreview tableName={dataSources[previewId].tableName} />
        </div>
      )}
    </div>
  );
}
