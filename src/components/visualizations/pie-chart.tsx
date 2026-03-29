import { useEffect, useRef } from "react";
import { pie as d3pie, arc as d3arc } from "d3-shape";
import type { QueryResult } from "@/engine/types";
import type { ColumnMapping } from "@/types/dashboard";

interface PieChartProps {
  result: QueryResult;
  mapping: ColumnMapping;
}

const COLORS = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2",
  "#59a14f", "#edc948", "#b07aa1", "#ff9da7",
  "#9c755f", "#bab0ac",
];

export function PieChart({ result, mapping }: PieChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || result.rows.length === 0) return;

    const { category, value } = mapping;
    if (!category || !value) return;

    const width = el.clientWidth;
    const height = el.clientHeight;
    const radius = Math.min(width, height) / 2 - 20;

    const data = result.rows.map((row) => ({
      label: String(row[category] ?? ""),
      value: Number(row[value]) || 0,
    }));

    const pieGen = d3pie<{ label: string; value: number }>().value(
      (d) => d.value,
    );
    const arcGen = d3arc<{ startAngle: number; endAngle: number }>()
      .innerRadius(0)
      .outerRadius(radius);
    const arcs = pieGen(data);

    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`);

    for (let i = 0; i < arcs.length; i++) {
      const a = arcs[i];
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", arcGen(a) ?? "");
      path.setAttribute("fill", COLORS[i % COLORS.length]);
      path.setAttribute("stroke", "white");
      path.setAttribute("stroke-width", "2");
      svg.appendChild(path);

      // Label
      const [cx, cy] = arcGen.centroid(a);
      if (a.endAngle - a.startAngle > 0.3) {
        const text = document.createElementNS(ns, "text");
        text.setAttribute("x", String(cx));
        text.setAttribute("y", String(cy));
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("font-size", "11");
        text.setAttribute("fill", "white");
        text.textContent = data[i].label;
        svg.appendChild(text);
      }
    }

    el.replaceChildren(svg);

    return () => {
      el.replaceChildren();
    };
  }, [result, mapping]);

  if (!mapping.category || !mapping.value) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Configure category and value columns
      </div>
    );
  }

  return <div ref={containerRef} className="flex h-full w-full items-center justify-center" />;
}
