import { useEffect, useRef } from "react";
import type { QueryEngine } from "@/engine/types";
import type { QueryResult } from "@/engine/types";
import type { Panel } from "@/types/dashboard";
import { queryCache } from "@/lib/query-cache";

/**
 * Auto-executes queries for panels that haven't been run yet.
 * Tracks per-panel execution rather than a single boolean flag,
 * so it correctly handles async store rehydration and StrictMode.
 */
export function useAutoRunPanels(
  engine: QueryEngine,
  panels: Panel[],
  onResult: (panelId: string, result: QueryResult | null) => void,
  onLoadingChange: (panelId: string, loading: boolean) => void,
) {
  const ranPanelsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const panelsToRun = panels.filter(
      (p) => p.query.sql.trim() && !ranPanelsRef.current.has(p.id),
    );
    if (panelsToRun.length === 0) return;

    let cancelled = false;

    (async () => {
      for (const panel of panelsToRun) {
        if (cancelled) break;

        // Check cache first
        const cached = queryCache.get(panel.query.sql);
        if (cached) {
          ranPanelsRef.current.add(panel.id);
          onResult(panel.id, cached);
          continue;
        }

        onLoadingChange(panel.id, true);
        try {
          const result = await engine.executeQuery(panel.query.sql);
          if (!cancelled) {
            ranPanelsRef.current.add(panel.id);
            queryCache.set(panel.query.sql, result);
            onResult(panel.id, result);
          }
        } catch {
          // Don't mark as ran on failure — allows retry on next render
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
