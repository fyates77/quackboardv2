import { useEffect, useRef, useState } from "react";
import vegaEmbed from "vega-embed";
import type { QueryResult } from "@/engine/types";

interface VegaLitePanelProps {
  spec: string;
  result: QueryResult | null;
}

export function VegaLitePanel({ spec, result }: VegaLitePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<{ finalize: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    async function render() {
      setError(null);
      let parsedSpec: Record<string, unknown>;
      try {
        parsedSpec = JSON.parse(spec || "{}");
      } catch (e) {
        if (!cancelled) setError(`Invalid JSON: ${(e as Error).message}`);
        return;
      }

      // Inject query results as data.values if result has rows
      if (result && result.rows.length > 0) {
        parsedSpec = {
          ...parsedSpec,
          data: { values: result.rows },
        };
      }

      // Ensure responsive sizing
      if (!parsedSpec.width) parsedSpec = { ...parsedSpec, width: "container" };
      if (!parsedSpec.height) parsedSpec = { ...parsedSpec, height: "container" };

      try {
        if (viewRef.current) {
          viewRef.current.finalize();
          viewRef.current = null;
        }
        if (!cancelled && container) {
          const embedResult = await vegaEmbed(container, parsedSpec as never, {
            actions: false,
            renderer: "svg",
            theme: "quartz",
          });
          if (!cancelled) viewRef.current = embedResult.view;
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }

    render();

    return () => {
      cancelled = true;
      if (viewRef.current) {
        viewRef.current.finalize();
        viewRef.current = null;
      }
    };
  }, [spec, result]);

  // ResizeObserver to handle container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      // vega-embed with width/height "container" handles resize via its own listener
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            color: "#f87171",
            fontSize: 12,
            padding: 16,
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            zIndex: 10,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
