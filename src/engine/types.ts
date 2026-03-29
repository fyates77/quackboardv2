export type Row = Record<string, unknown>;

export interface ColumnInfo {
  name: string;
  type: string;
}

export interface QueryResult {
  columns: ColumnInfo[];
  rows: Row[];
  rowCount: number;
  elapsed: number;
}

export type FileFormat = "csv" | "parquet" | "json";

export interface RegisterDataSourceOptions {
  tableName: string;
  fileName: string;
  format: FileFormat;
  buffer: Uint8Array;
}

export interface QueryEngine {
  initialize(): Promise<void>;
  isReady(): boolean;
  registerDataSource(options: RegisterDataSourceOptions): Promise<void>;
  unregisterDataSource(tableName: string): Promise<void>;
  listTables(): Promise<string[]>;
  describeTable(tableName: string): Promise<ColumnInfo[]>;
  executeQuery(sql: string): Promise<QueryResult>;
  validateQuery(sql: string): Promise<{ valid: boolean; error?: string }>;
  destroy(): Promise<void>;
}
