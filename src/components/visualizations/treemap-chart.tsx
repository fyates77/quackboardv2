import { useEffect, useRef } from "react";
import {
  treemap,
  treemapSquarify,
  treemapBinary,
  treemapSlice,
  treemapDice,
  stratify,
} from "d3-hierarchy";
import type { QueryResult } from "@/engine/types";
import type { ColumnMapping, VisualizationOptions } from "@/types/dashboard";

const COLORS = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2",
  "#59a14f", "#edc948", "#b07aa1", "#ff9da7",
  "#9c755f", "#bab0ac",
];

interface TreemapChartProps {
  result: QueryResult;
  mapping: ColumnMapping;
  options: VisualizationOptions;
}

const TILING_FNS = {
  squarify: treemapSquarify,
  binary: treemapBinary,
  slice: treemapSlice,
  dice: treemapDice,
} as const;

export function TreemapChart({ result, mapping, options }: TreemapChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || result.rows.length === 0) return;

    const pathCol = mapping.path;
    const valueCol = mapping.value;
    if (!pathCol || !valueCol) return;

    const delimiter = options.treeDelimiter ?? "/";

    const render = () => {
      const width = el.clientWidth || 400;
      const height = el.clientHeight || 300;
      const padding = options.treemapPadding ?? 2;
      const tiling = TILING_FNS[options.treemapTiling ?? "squarify"];

      // Build hierarchical data from path strings
      const rows = result.rows as Record<string, unknown>[];

      // Create a flat list with id and parentId using stratify
      type FlatNode = { id: string; value: number };
      const nodeMap = new Map<string, number>();

      for (const row of rows) {
        const path = String(row[pathCol] ?? "");
        const val = Number(row[valueCol]) || 0;
        nodeMap.set(path, (nodeMap.get(path) ?? 0) + val);

        // Ensure all ancestors exist
        const parts = path.split(delimiter);
        for (let i = 1; i < parts.length; i++) {
          const ancestor = parts.slice(0, i).join(delimiter);
          if (!nodeMap.has(ancestor)) nodeMap.set(ancestor, 0);
        }
      }

      // Add root if needed
      if (!nodeMap.has("")) nodeMap.set("", 0);

      const flatData: FlatNode[] = Array.from(nodeMap, ([id, value]) => ({
        id,
        value,
      }));

      try {
        const strat = stratify<FlatNode>()
          .id((d) => d.id)
          .parentId((d) => {
            if (d.id === "") return null;
            const parts = d.id.split(delimiter);
            if (parts.length <= 1) return "";
            return parts.slice(0, -1).join(delimiter);
          });

        const root = strat(flatData);
        root.sum((d) => d.value).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

        const treemapLayout = treemap<FlatNode>()
          .tile(tiling)
          .size([width, height])
          .padding(padding);

        const laid = treemapLayout(root);

        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("width", String(width));
        svg.setAttribute("height", String(height));
        svg.style.background = "transparent";

        // Color by top-level ancestor
        const topLevel = laid.children ?? [];
        const colorMap = new Map<string, string>();
        topLevel.forEach((child, i) => {
          colorMap.set(child.data.id, COLORS[i % COLORS.length]);
        });

        const getColor = (node: typeof laid): string => {
          let current = node;
          while (current.parent && current.parent.parent) {
            current = current.parent;
          }
          return colorMap.get(current.data.id) ?? COLORS[0];
        };

        for (const leaf of laid.leaves()) {
          const x0 = leaf.x0;
          const y0 = leaf.y0;
          const x1 = leaf.x1;
          const y1 = leaf.y1;
          const w = x1 - x0;
          const h = y1 - y0;

          if (w < 1 || h < 1) continue;

          const rect = document.createElementNS(ns, "rect");
          rect.setAttribute("x", String(x0));
          rect.setAttribute("y", String(y0));
          rect.setAttribute("width", String(w));
          rect.setAttribute("height", String(h));
          rect.setAttribute("fill", getColor(leaf));
          rect.setAttribute("stroke", "white");
          rect.setAttribute("stroke-width", "1");
          rect.setAttribute("opacity", "0.85");

          // Tooltip on hover
          const title = document.createElementNS(ns, "title");
          const leafName = leaf.data.id.split(delimiter).pop() ?? leaf.data.id;
          title.textContent = `${leafName}: ${(leaf.value ?? 0).toLocaleString()}`;
          rect.appendChild(title);

          svg.appendChild(rect);

          // Label if cell is large enough
          if (w > 40 && h > 16) {
            const text = document.createElementNS(ns, "text");
            text.setAttribute("x", String(x0 + 4));
            text.setAttribute("y", String(y0 + 13));
            text.setAttribute("font-size", "11");
            text.setAttribute("font-weight", "500");
            text.setAttribute("fill", "white");

            // Clip text to cell width
            const clipId = `clip-${leaf.data.id.replace(/[^a-zA-Z0-9]/g, "-")}`;
            const clipPath = document.createElementNS(ns, "clipPath");
            clipPath.setAttribute("id", clipId);
            const clipRect = document.createElementNS(ns, "rect");
            clipRect.setAttribute("x", String(x0));
            clipRect.setAttribute("y", String(y0));
            clipRect.setAttribute("width", String(w));
            clipRect.setAttribute("height", String(h));
            clipPath.appendChild(clipRect);
            svg.appendChild(clipPath);
            text.setAttribute("clip-path", `url(#${clipId})`);

            text.textContent = leafName;
            svg.appendChild(text);

            // Value label if cell is tall enough
            if (h > 30) {
              const valText = document.createElementNS(ns, "text");
              valText.setAttribute("x", String(x0 + 4));
              valText.setAttribute("y", String(y0 + 26));
              valText.setAttribute("font-size", "10");
              valText.setAttribute("fill", "rgba(255,255,255,0.75)");
              valText.setAttribute("clip-path", `url(#${clipId})`);
              valText.textContent = (leaf.value ?? 0).toLocaleString();
              svg.appendChild(valText);
            }
          }
        }

        el.replaceChildren(svg);
      } catch {
        // If stratify fails (e.g. malformed paths), show a hint
        el.replaceChildren();
        const hint = document.createElement("div");
        hint.className = "flex h-full items-center justify-center text-xs text-muted-foreground";
        hint.textContent = "Could not build tree from path data. Check delimiter.";
        el.appendChild(hint);
      }
    };

    render();

    const ro = new ResizeObserver(() => render());
    ro.observe(el);

    return () => {
      ro.disconnect();
      el.replaceChildren();
    };
  }, [result, mapping, options]);

  if (!mapping.path || !mapping.value) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Configure path and value columns to render treemap
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
