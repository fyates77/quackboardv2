import { useCallback, useRef, useState } from "react";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { useFileDrop } from "@/hooks/use-file-drop";
import { useEngine } from "@/engine/use-engine";
import { useDataSourceStore } from "@/stores/data-source-store";
import { storeBlob } from "@/lib/blob-storage";
import {
  detectFormat,
  sanitizeTableName,
  readFileAsUint8Array,
} from "@/lib/file-utils";
import { createId } from "@/lib/id";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function FileDropZone() {
  const engine = useEngine();
  const addDataSource = useDataSourceStore((s) => s.addDataSource);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: File[]) => {
      setUploading(true);
      setError(null);

      for (const file of files) {
        const format = detectFormat(file.name);
        if (!format) {
          setError(
            `Unsupported file type: ${file.name}. Use CSV, Parquet, or JSON.`,
          );
          continue;
        }

        try {
          const buffer = await readFileAsUint8Array(file);
          const storageKey = createId();
          const tableName = sanitizeTableName(file.name);

          await storeBlob(storageKey, buffer);

          await engine.registerDataSource({
            tableName,
            fileName: file.name,
            format,
            buffer,
          });

          const columns = await engine.describeTable(tableName);

          addDataSource({
            name: file.name,
            tableName,
            fileName: file.name,
            format,
            sizeBytes: file.size,
            columns,
            storageKey,
          });
        } catch (e) {
          setError(
            `Failed to load ${file.name}: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }

      setUploading(false);
    },
    [engine, addDataSource],
  );

  const { isDragOver, handleDragOver, handleDragLeave, handleDrop } =
    useFileDrop(processFiles);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) processFiles(files);
      e.target.value = "";
    },
    [processFiles],
  );

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Loading files...</p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">
              Drop CSV, Parquet, or JSON files here
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Files are loaded into DuckDB as queryable tables
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse files
            </Button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv,.tsv,.parquet,.json,.jsonl,.ndjson"
          multiple
          onChange={handleFileInput}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
