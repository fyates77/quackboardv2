import { createFileRoute } from "@tanstack/react-router";
import { FileDropZone } from "@/components/data-sources/file-drop-zone";
import { DataSourceList } from "@/components/data-sources/data-source-list";

export const Route = createFileRoute("/data-sources/")({
  component: DataSourcesPage,
});

function DataSourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Sources</h1>
        <p className="text-muted-foreground">
          Upload and manage your data files
        </p>
      </div>

      <FileDropZone />
      <DataSourceList />
    </div>
  );
}
