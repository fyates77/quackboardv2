import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { QueryResult } from "@/engine/types";

interface CustomVizPanelProps {
  result: QueryResult;
  code: string;
}

/**
 * Executes user-authored JS with a D3 context injected.
 *
 * The function receives a single `ctx` argument with:
 *   - container: HTMLDivElement  — mount point, cleared before each run
 *   - data: Record<string, unknown>[]  — query result rows
 *   - columns: { name: string; type: string }[]  — column metadata
 *   - d3: typeof d3  — full D3 library
 *   - width: number
 *   - height: number
 *
 * Example:
 *   const { container, data, d3, width, height } = ctx;
 *   const svg = d3.select(container).append("svg").attr("width", width).attr("height", height);
 *   ...
 */
export function CustomVizPanel({ result, code }: CustomVizPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !code.trim()) return;

    // Clear previous content and error
    el.replaceChildren();
    setError(null);

    const width = el.clientWidth || 400;
    const height = el.clientHeight || 300;

    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function("ctx", code);
      fn({
        container: el,
        data: result.rows,
        columns: result.columns,
        d3,
        width,
        height,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }

    const ro = new ResizeObserver(() => {
      el.replaceChildren();
      setError(null);
      const w = el.clientWidth || 400;
      const h = el.clientHeight || 300;
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function("ctx", code);
        fn({ container: el, data: result.rows, columns: result.columns, d3, width: w, height: h });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      el.replaceChildren();
    };
  }, [result, code]);

  return (
    <div className="relative flex h-full w-full flex-col">
      <div ref={containerRef} className="flex-1 overflow-hidden" />
      {error && (
        <div className="absolute bottom-0 left-0 right-0 max-h-24 overflow-auto rounded-b bg-destructive/10 px-3 py-2 font-mono text-[10px] text-destructive">
          <span className="font-semibold">Error: </span>{error}
        </div>
      )}
    </div>
  );
}
