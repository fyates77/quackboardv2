import type { FileFormat } from "@/types/data-source";

const FORMAT_EXTENSIONS: Record<string, FileFormat> = {
  csv: "csv",
  tsv: "csv",
  parquet: "parquet",
  json: "json",
  jsonl: "json",
  ndjson: "json",
};

export function detectFormat(fileName: string): FileFormat | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return FORMAT_EXTENSIONS[ext] ?? null;
}

export function sanitizeTableName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  return base
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^(\d)/, "_$1")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function readFileAsUint8Array(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
