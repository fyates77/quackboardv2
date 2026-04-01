import { useEffect, useRef } from "react";
import type { QueryResult } from "@/engine/types";
import type { ColumnMapping, VisualizationOptions } from "@/types/dashboard";

const COLORS = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2",
  "#59a14f", "#edc948", "#b07aa1", "#ff9da7",
  "#9c755f", "#bab0ac",
];

interface FunnelChartProps {
  result: QueryResult;
  mapping: ColumnMapping;
  options: VisualizationOptions;
  onClickDatum?: (datum: { column: string; value: unknown }) => void;
}

export function FunnelChart({ result, mapping, options, onClickDatum }: FunnelChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || result.rows.length === 0) return;

    const { category, value } = mapping;
    if (!category || !value) return;

    const data = result.rows.map((row) => ({
      label: String(row[category] ?? ""),
      value: Number(row[value]) || 0,
    }));

    const maxValue = Math.max(...data.map((d) => d.value));
    if (maxValue === 0) return;

    const width = el.clientWidth || 400;
    const height = el.clientHeight || 300;
    const padding = 40;
    const stageHeight = (height - padding * 2) / data.length;
    const maxBarWidth = width - padding * 2;
    const showPct = options.funnelShowPercentage !== false;
    const showConv = options.funnelShowConversion !== false;

    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.style.background = "transparent";

    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      const nextD = data[i + 1];

      const topWidth = (d.value / maxValue) * maxBarWidth;
      const bottomWidth = nextD
        ? (nextD.value / maxValue) * maxBarWidth
        : topWidth * 0.6;

      const y = padding + i * stageHeight;
      const cx = width / 2;

      // Trapezoid points
      const x1 = cx - topWidth / 2;
      const x2 = cx + topWidth / 2;
      const x3 = cx + bottomWidth / 2;
      const x4 = cx - bottomWidth / 2;

      const path = document.createElementNS(ns, "path");
      path.setAttribute(
        "d",
        `M${x1},${y} L${x2},${y} L${x3},${y + stageHeight - 2} L${x4},${y + stageHeight - 2} Z`,
      );
      path.setAttribute("fill", COLORS[i % COLORS.length]);
      path.setAttribute("opacity", "0.85");
      if (onClickDatum && category) {
        path.style.cursor = "pointer";
        path.addEventListener("click", () => {
          onClickDatum({ column: category, value: d.label });
        });
      }
      svg.appendChild(path);

      // Label
      const text = document.createElementNS(ns, "text");
      text.setAttribute("x", String(cx));
      text.setAttribute("y", String(y + stageHeight / 2));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("font-size", "12");
      text.setAttribute("font-weight", "600");
      text.setAttribute("fill", "white");

      let label = d.label;
      if (showPct) {
        const pct = ((d.value / maxValue) * 100).toFixed(0);
        label += ` (${pct}%)`;
      }
      text.textContent = label;
      svg.appendChild(text);

      // Value below label
      const valText = document.createElementNS(ns, "text");
      valText.setAttribute("x", String(cx));
      valText.setAttribute("y", String(y + stageHeight / 2 + 14));
      valText.setAttribute("text-anchor", "middle");
      valText.setAttribute("dominant-baseline", "middle");
      valText.setAttribute("font-size", "10");
      valText.setAttribute("fill", "rgba(255,255,255,0.8)");
      valText.textContent = d.value.toLocaleString();
      svg.appendChild(valText);

      // Conversion rate between stages
      if (showConv && nextD && d.value > 0) {
        const convRate = ((nextD.value / d.value) * 100).toFixed(1);
        const convText = document.createElementNS(ns, "text");
        convText.setAttribute("x", String(cx + topWidth / 2 + 8));
        convText.setAttribute("y", String(y + stageHeight - 1));
        convText.setAttribute("text-anchor", "start");
        convText.setAttribute("dominant-baseline", "middle");
        convText.setAttribute("font-size", "10");
        convText.setAttribute("fill", "currentColor");
        convText.setAttribute("opacity", "0.6");
        convText.textContent = `${convRate}%`;
        svg.appendChild(convText);
      }
    }

    el.replaceChildren(svg);

    const ro = new ResizeObserver(() => {
      // Re-trigger by setting a key; the useEffect deps handle it.
      // For simplicity, just re-run the whole effect.
      el.replaceChildren();
      el.dispatchEvent(new Event("resize"));
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      el.replaceChildren();
    };
  }, [result, mapping, options]);

  if (!mapping.category || !mapping.value) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Configure category and value columns to render funnel
      </div>
    );
  }

  return <div ref={containerRef} className="flex h-full w-full items-center justify-center" />;
}
