import { useEffect, useState } from "react";
import { useEngine } from "@/engine/use-engine";
import type { QueryResult } from "@/engine/types";
import { Loader2 } from "lucide-react";

interface DataSourcePreviewProps {
  tableName: string;
  limit?: number;
}

export function DataSourcePreview({
  tableName,
  limit = 50,
}: DataSourcePreviewProps) {
  const engine = useEngine();
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    engine
      .executeQuery(`SELECT * FROM "${tableName}" LIMIT ${limit}`)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [engine, tableName, limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!result || result.rows.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No data
      </p>
    );
  }

  return (
    <div className="overflow-auto rounded border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/50">
            {result.columns.map((col) => (
              <th
                key={col.name}
                className="whitespace-nowrap px-3 py-2 text-left font-medium"
              >
                {col.name}
                <span className="ml-1 font-normal text-muted-foreground">
                  {col.type}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              {result.columns.map((col) => (
                <td
                  key={col.name}
                  className="whitespace-nowrap px-3 py-1.5"
                >
                  {row[col.name] == null
                    ? <span className="text-muted-foreground">NULL</span>
                    : String(row[col.name])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
        Showing {result.rows.length} rows ({result.elapsed.toFixed(1)}ms)
      </div>
    </div>
  );
}
