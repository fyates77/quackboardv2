import * as duckdb from "@duckdb/duckdb-wasm";
import type {
  QueryEngine,
  QueryResult,
  RegisterDataSourceOptions,
  ColumnInfo,
} from "./types";

export class DuckDBWasmEngine implements QueryEngine {
  private db: duckdb.AsyncDuckDB | null = null;
  private conn: duckdb.AsyncDuckDBConnection | null = null;
  private ready = false;

  async initialize(): Promise<void> {
    const DUCKDB_BUNDLES = await duckdb.selectBundle({
      mvp: {
        mainModule: new URL(
          "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm",
          import.meta.url,
        ).href,
        mainWorker: new URL(
          "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js",
          import.meta.url,
        ).href,
      },
      eh: {
        mainModule: new URL(
          "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm",
          import.meta.url,
        ).href,
        mainWorker: new URL(
          "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js",
          import.meta.url,
        ).href,
      },
    });

    const logger = new duckdb.ConsoleLogger();
    const worker = new Worker(DUCKDB_BUNDLES.mainWorker!, {
      type: "module",
    });

    this.db = new duckdb.AsyncDuckDB(logger, worker);
    await this.db.instantiate(DUCKDB_BUNDLES.mainModule);
    this.conn = await this.db.connect();
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  async registerDataSource(options: RegisterDataSourceOptions): Promise<void> {
    if (!this.db || !this.conn) throw new Error("Engine not initialized");

    await this.db.registerFileBuffer(options.fileName, options.buffer);

    const readerFn: Record<string, string> = {
      csv: "read_csv_auto",
      parquet: "read_parquet",
      json: "read_json_auto",
    };

    const fn = readerFn[options.format];
    await this.conn.query(
      `CREATE OR REPLACE TABLE "${options.tableName}" AS SELECT * FROM ${fn}('${options.fileName}')`,
    );
  }

  async unregisterDataSource(tableName: string): Promise<void> {
    if (!this.conn) throw new Error("Engine not initialized");
    await this.conn.query(`DROP TABLE IF EXISTS "${tableName}"`);
  }

  async listTables(): Promise<string[]> {
    if (!this.conn) throw new Error("Engine not initialized");
    const result = await this.conn.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'",
    );
    return result.toArray().map((row) => {
      const obj = row.toJSON() as Record<string, unknown>;
      return String(obj["table_name"]);
    });
  }

  async describeTable(tableName: string): Promise<ColumnInfo[]> {
    if (!this.conn) throw new Error("Engine not initialized");
    const result = await this.conn.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}' AND table_schema = 'main' ORDER BY ordinal_position`,
    );
    return result.toArray().map((row) => {
      const obj = row.toJSON() as Record<string, unknown>;
      return {
        name: String(obj["column_name"]),
        type: String(obj["data_type"]),
      };
    });
  }

  async executeQuery(sql: string): Promise<QueryResult> {
    if (!this.conn) throw new Error("Engine not initialized");

    const start = performance.now();
    const arrowResult = await this.conn.query(sql);
    const elapsed = performance.now() - start;

    const columns: ColumnInfo[] = arrowResult.schema.fields.map((f) => ({
      name: f.name,
      type: String(f.type),
    }));

    const rows = arrowResult.toArray().map((row) => row.toJSON() as Record<string, unknown>);

    return { columns, rows, rowCount: rows.length, elapsed };
  }

  async validateQuery(
    sql: string,
  ): Promise<{ valid: boolean; error?: string }> {
    if (!this.conn) throw new Error("Engine not initialized");
    try {
      await this.conn.query(`EXPLAIN ${sql}`);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: String(e) };
    }
  }

  async destroy(): Promise<void> {
    if (this.conn) {
      await this.conn.close();
      this.conn = null;
    }
    if (this.db) {
      await this.db.terminate();
      this.db = null;
    }
    this.ready = false;
  }
}
