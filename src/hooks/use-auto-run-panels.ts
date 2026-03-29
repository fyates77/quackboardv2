import { useEffect, useRef } from "react";
import type { QueryEngine } from "@/engine/types";
import type { QueryResult } from "@/engine/types";
import type { Panel } from "@/types/dashboard";
import { queryCache } from "@/lib/query-cache";

/**
 * Auto-executes queries for panels on dashboard load.
 *
 * Uses refs for all callbacks and data so the effect doesn't re-fire
 * when the store updates (which changes the panels array reference).
 * Only re-triggers when panels go from 0 → N (store rehydration).
 */
export function useAutoRunPanels(
  engine: QueryEngine,
  panels: Panel[],
  onResult: (panelId: string, result: QueryResult | null) => void,
  onLoadingChange: (panelId: string, loading: boolean) => void,
) {
  const engineRef = useRef(engine);
  engineRef.current = engine;
  const panelsRef = useRef(panels);
  panelsRef.current = panels;
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onLoadingChangeRef = useRef(onLoadingChange);
  onLoadingChangeRef.current = onLoadingChange;

  const ranPanelsRef = useRef<Set<string>>(new Set());

  // Stable trigger: only changes when panel count goes from 0 to non-zero
  // (i.e., store rehydration from IndexedDB)
  const panelCount = panels.length;
  const hadPanelsRef = useRef(panelCount > 0);
  const triggerRef = useRef(0);
  if (panelCount > 0 && !hadPanelsRef.current) {
    hadPanelsRef.current = true;
    triggerRef.current += 1;
  }
  const trigger = triggerRef.current;

  useEffect(() => {
    const currentPanels = panelsRef.current;
    const currentEngine = engineRef.current;

    const panelsToRun = currentPanels.filter(
      (p) => p.query.sql.trim() && !ranPanelsRef.current.has(p.id),
    );
    if (panelsToRun.length === 0) return;

    let active = true;

    (async () => {
      for (const panel of panelsToRun) {
        if (!active) break;

        const cached = queryCache.get(panel.query.sql);
        if (cached) {
          ranPanelsRef.current.add(panel.id);
          onResultRef.current(panel.id, cached);
          continue;
        }

        onLoadingChangeRef.current(panel.id, true);
        try {
          const result = await currentEngine.executeQuery(panel.query.sql);
          ranPanelsRef.current.add(panel.id);
          queryCache.set(panel.query.sql, result);
          if (active) {
            onResultRef.current(panel.id, result);
          }
        } catch {
          // Don't mark as ran on failure — allows retry
        } finally {
          // ALWAYS clear loading, even if effect was cleaned up.
          // Worst case: a brief flash if a new run immediately sets it true again.
          onLoadingChangeRef.current(panel.id, false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [trigger]);
}
