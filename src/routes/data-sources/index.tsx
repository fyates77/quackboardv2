import { createFileRoute } from "@tanstack/react-router";
import { Database } from "lucide-react";
import { useDataSourceStore } from "@/stores/data-source-store";

export const Route = createFileRoute("/data-sources/")({
  component: DataSourcesPage,
});

function DataSourcesPage() {
  const { dataSources } = useDataSourceStore();
  const dsList = Object.values(dataSources);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Data Sources</h1>
        <p className="text-muted-foreground">
          Upload and manage your data files
        </p>
      </div>

      <div className="mb-6 flex items-center justify-center rounded-lg border-2 border-dashed p-12">
        <div className="text-center">
          <Database className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">
            Drop CSV, Parquet, or JSON files here
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Files will be loaded into DuckDB as queryable tables
          </p>
        </div>
      </div>

      {dsList.length > 0 && (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Table</th>
                <th className="p-3 text-left font-medium">Format</th>
                <th className="p-3 text-left font-medium">Columns</th>
              </tr>
            </thead>
            <tbody>
              {dsList.map((ds) => (
                <tr key={ds.id} className="border-b">
                  <td className="p-3">{ds.name}</td>
                  <td className="p-3 font-mono text-xs">{ds.tableName}</td>
                  <td className="p-3 uppercase">{ds.format}</td>
                  <td className="p-3">{ds.columns.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
