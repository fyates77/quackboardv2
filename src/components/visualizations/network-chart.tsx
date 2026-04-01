import { useEffect, useRef } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from "d3-force";
import type { QueryResult } from "@/engine/types";
import type { ColumnMapping, VisualizationOptions } from "@/types/dashboard";

interface NetworkChartProps {
  result: QueryResult;
  mapping: ColumnMapping;
  options: VisualizationOptions;
  onClickDatum?: (datum: { column: string; value: unknown }) => void;
}

interface GraphNode {
  id: string;
  // Set by d3-force simulation
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

interface GraphLink {
  // Before simulation: string IDs; after: resolved GraphNode references
  source: string | GraphNode;
  target: string | GraphNode;
  weight: number;
  index?: number;
}

const NODE_COLORS = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2",
  "#59a14f", "#edc948", "#b07aa1", "#ff9da7",
  "#9c755f", "#bab0ac",
];

export function NetworkChart({ result, mapping, options, onClickDatum }: NetworkChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || result.rows.length === 0) return;

    const { source: srcCol, target: tgtCol, value: weightCol } = mapping;
    if (!srcCol || !tgtCol) return;

    // Build node set and link list from rows
    const nodeIds = new Set<string>();
    const links: GraphLink[] = [];

    for (const row of result.rows) {
      const s = String(row[srcCol] ?? "");
      const t = String(row[tgtCol] ?? "");
      if (!s || !t) continue;
      nodeIds.add(s);
      nodeIds.add(t);
      links.push({
        source: s,
        target: t,
        weight: weightCol ? (Number(row[weightCol]) || 1) : 1,
      } as GraphLink);
    }

    const nodes: GraphNode[] = Array.from(nodeIds).map((id) => ({ id }));

    const width = el.clientWidth || 500;
    const height = el.clientHeight || 400;

    const nodeRadius = options.networkNodeRadius ?? 6;
    const showLabels = options.networkShowLabels !== false;
    const linkDistance = options.networkLinkDistance ?? 80;
    const charge = options.networkCharge ?? -200;

    // --- Simulation ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const simulation = forceSimulation<GraphNode>(nodes as any)
      .force(
        "link",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        forceLink<GraphNode, GraphLink>(links as any)
          .id((d: GraphNode) => d.id)
          .distance(linkDistance),
      )
      .force("charge", forceManyBody().strength(charge))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collide", forceCollide(nodeRadius + 2));

    // --- SVG ---
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.style.overflow = "visible";

    // Arrowhead marker
    const defs = document.createElementNS(ns, "defs");
    const marker = document.createElementNS(ns, "marker");
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("markerWidth", "8");
    marker.setAttribute("markerHeight", "6");
    marker.setAttribute("refX", "8");
    marker.setAttribute("refY", "3");
    marker.setAttribute("orient", "auto");
    const arrowPath = document.createElementNS(ns, "path");
    arrowPath.setAttribute("d", "M0,0 L8,3 L0,6 Z");
    arrowPath.setAttribute("fill", "currentColor");
    arrowPath.setAttribute("opacity", "0.3");
    marker.appendChild(arrowPath);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Link elements
    const linkEls: SVGLineElement[] = links.map((link) => {
      const line = document.createElementNS(ns, "line");
      const strokeWidth = Math.max(1, Math.min(6, link.weight));
      line.setAttribute("stroke", "currentColor");
      line.setAttribute("stroke-opacity", "0.25");
      line.setAttribute("stroke-width", String(strokeWidth));
      line.setAttribute("marker-end", "url(#arrowhead)");
      svg.appendChild(line);
      return line;
    });

    // Node color map — unique color per node (cycle through palette)
    const nodeColorMap = new Map<string, string>();
    nodes.forEach((n, i) => nodeColorMap.set(n.id, NODE_COLORS[i % NODE_COLORS.length]));

    // Node elements
    const nodeEls: SVGCircleElement[] = nodes.map((node) => {
      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("r", String(nodeRadius));
      circle.setAttribute("fill", nodeColorMap.get(node.id) ?? NODE_COLORS[0]);
      circle.setAttribute("stroke", "var(--color-background, #fff)");
      circle.setAttribute("stroke-width", "1.5");
      circle.style.cursor = onClickDatum ? "pointer" : "default";
      if (onClickDatum && srcCol) {
        circle.addEventListener("click", () => {
          onClickDatum({ column: srcCol, value: node.id });
        });
      }
      svg.appendChild(circle);
      return circle;
    });

    // Label elements
    const labelEls: SVGTextElement[] = showLabels
      ? nodes.map((node) => {
          const text = document.createElementNS(ns, "text");
          text.textContent = node.id;
          text.setAttribute("font-size", "10");
          text.setAttribute("fill", "currentColor");
          text.setAttribute("text-anchor", "middle");
          text.setAttribute("dominant-baseline", "auto");
          text.setAttribute("pointer-events", "none");
          svg.appendChild(text);
          return text;
        })
      : [];

    // Tick handler — update positions each simulation step
    // After simulation initialises, link.source/target are resolved to GraphNode objects
    simulation.on("tick", () => {
      links.forEach((link, i) => {
        const s = link.source as GraphNode;
        const t = link.target as GraphNode;
        const sx = s.x ?? 0, sy = s.y ?? 0;
        const tx = t.x ?? 0, ty = t.y ?? 0;
        // Shorten line so arrowhead doesn't overlap node
        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const offset = nodeRadius + 4;
        linkEls[i].setAttribute("x1", String(sx + (dx / dist) * offset));
        linkEls[i].setAttribute("y1", String(sy + (dy / dist) * offset));
        linkEls[i].setAttribute("x2", String(tx - (dx / dist) * offset));
        linkEls[i].setAttribute("y2", String(ty - (dy / dist) * offset));
      });

      nodes.forEach((node, i) => {
        const x = node.x ?? 0;
        const y = node.y ?? 0;
        nodeEls[i].setAttribute("cx", String(x));
        nodeEls[i].setAttribute("cy", String(y));
        if (labelEls[i]) {
          labelEls[i].setAttribute("x", String(x));
          labelEls[i].setAttribute("y", String(y - nodeRadius - 3));
        }
      });
    });

    el.replaceChildren(svg);

    // Resize observer restarts on size change
    const ro = new ResizeObserver(() => {
      simulation.stop();
      el.replaceChildren();
    });
    ro.observe(el);

    return () => {
      simulation.stop();
      ro.disconnect();
      el.replaceChildren();
    };
  }, [result, mapping, options, onClickDatum]);

  if (!mapping.source || !mapping.target) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Configure source and target columns to render network
      </div>
    );
  }

  return <div ref={containerRef} className="flex h-full w-full" />;
}
