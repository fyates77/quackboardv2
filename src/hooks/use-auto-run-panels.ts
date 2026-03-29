import { useEffect, useRef } from "react";
import type { QueryEngine } from "@/engine/types";
import type { QueryResult } from "@/engine/types";
import type { Panel } from "@/types/dashboard";

export function useAutoRunPanels(
  engine: QueryEngine,
  panels: Panel[],
  onResult: (panelId: string, result: QueryResult | null) => void,
  onLoadingChange: (panelId: string, loading: boolean) => void,
) {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const panelsWithSql = panels.filter((p) => p.query.sql.trim());
    if (panelsWithSql.length === 0) return;

    let cancelled = false;

    (async () => {
      for (const panel of panelsWithSql) {
        if (cancelled) break;
        onLoadingChange(panel.id, true);
        try {
          const result = await engine.executeQuery(panel.query.sql);
          if (!cancelled) onResult(panel.id, result);
        } catch {
          // Skip panels that fail silently on auto-run
        } finally {
          if (!cancelled) onLoadingChange(panel.id, false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [engine, panels, onResult, onLoadingChange]);
}
