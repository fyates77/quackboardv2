import { useCallback, useState } from "react";
import { useEngine } from "./use-engine";
import { queryCache } from "@/lib/query-cache";
import type { QueryResult } from "./types";

interface UseQueryReturn {
  data: QueryResult | null;
  loading: boolean;
  error: string | null;
  execute: (sql: string) => Promise<QueryResult | null>;
}

export function useQuery(): UseQueryReturn {
  const engine = useEngine();
  const [data, setData] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (sql: string): Promise<QueryResult | null> => {
      if (!sql.trim()) return null;

      // Check cache
      const cached = queryCache.get(sql);
      if (cached) {
        setData(cached);
        setError(null);
        return cached;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await engine.executeQuery(sql);
        queryCache.set(sql, result);
        setData(result);
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setData(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [engine],
  );

  return { data, loading, error, execute };
}
