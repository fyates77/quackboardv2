import type { ColumnInfo } from "@/engine/types";

export type FileFormat = "csv" | "parquet" | "json";

export interface DataSource {
  id: string;
  name: string;
  tableName: string;
  fileName: string;
  format: FileFormat;
  sizeBytes: number;
  rowCount: number | null;
  columns: ColumnInfo[];
  createdAt: string;
  storageKey: string;
}
