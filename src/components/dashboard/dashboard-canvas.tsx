import React, { useCallback, useMemo } from "react";
import {
  GridLayout,
  verticalCompactor,
  type Layout,
  type LayoutItem as RGLLayoutItem,
} from "react-grid-layout";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useContainerWidth } from "@/hooks/use-resize-observer";
import { PanelContainer } from "./panel-container";
import { PanelErrorBoundary } from "./panel-error-boundary";
import type { LayoutItem, Panel } from "@/types/dashboard";
import type { QueryResult } from "@/engine/types";

interface DashboardCanvasProps {
  dashboardId: string;
  queryResults: Map<string, QueryResult>;
  loadingPanels: Set<string>;
  onDuplicatePanel?: (sourcePanelId: string, newPanelId: string) => void;
  /** If set, only show panels in this set (for tabs) */
  visiblePanelIds?: Set<string> | null;
  /** All panel results for template variable resolution */
  allResults?: Map<string, QueryResult>;
  /** Callback when a chart datum is clicked */
  onClickDatum?: (panelId: string, datum: { column: string; value: unknown }) => void;
  /** Theme spacing multiplier (default 1) */
  spacingMultiplier?: number;
  /** Layout mode: grid (default) or scroll */
  layoutMode?: "grid" | "scroll";
  /** Consumer view — disable editing interactions */
  readOnly?: boolean;
  /** Pre-filtered panels (pass from parent to avoid double filtering) */
  filteredPanels?: Panel[];
}

const BASE_MARGIN = 12;

function CanvasShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex-1 overflow-auto"
      style={{
        backgroundColor: "hsl(var(--muted))",
        backgroundImage:
          "radial-gradient(circle, hsl(var(--border)) 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div
        className="mx-auto my-8 bg-background shadow-xl rounded-sm"
        style={{ maxWidth: 1440, minHeight: 640, padding: 24 }}
      >
        {children}
      </div>
    </div>
  );
}

function getGridConfig(spacingMultiplier = 1) {
  const m = Math.round(BASE_MARGIN * spacingMultiplier);
  return {
    cols: 12,
    rowHeight: 80,
    margin: [m, m] as const,
    containerPadding: [0, 0] as const,
    maxRows: Infinity,
  };
}

export function DashboardCanvas({
  dashboardId,
  queryResults,
  loadingPanels,
  onDuplicatePanel,
  visiblePanelIds,
  allResults,
  onClickDatum,
  spacingMultiplier,
  layoutMode = "grid",
  readOnly = false,
  filteredPanels: filteredPanelsProp,
}: DashboardCanvasProps) {
  const dashboard = useDashboardStore((s) => s.dashboards[dashboardId]);
  const updateLayout = useDashboardStore((s) => s.updateLayout);
  const [containerRef, containerWidth] = useContainerWidth();

  const gridConfig = useMemo(() => getGridConfig(spacingMultiplier), [spacingMultiplier]);

  const layout: readonly RGLLayoutItem[] = useMemo(
    () => {
      const panels = dashboard?.panels ?? [];
      return (dashboard?.layout ?? []).map((l) => {
        const panel = panels.find((p) => p.id === l.i);
        if (panel?.fullWidth) {
          return { i: l.i, x: 0, y: l.y, w: 12, h: l.h, minW: 2, minH: l.minH ?? 2, static: true };
        }
        return { i: l.i, x: l.x, y: l.y, w: l.w, h: l.h, minW: l.minW ?? 2, minH: l.minH ?? 2 };
      });
    },
    [dashboard?.layout, dashboard?.panels],
  );

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      const items: LayoutItem[] = newLayout.map((l) => ({
        i: l.i,
        x: l.x,
        y: l.y,
        w: l.w,
        h: l.h,
        minW: l.minW,
        minH: l.minH,
      }));
      updateLayout(dashboardId, items);
    },
    [dashboardId, updateLayout],
  );

  if (!dashboard) return null;

  const filteredPanels = filteredPanelsProp ?? dashboard.panels.filter(
    (p) => !visiblePanelIds || visiblePanelIds.has(p.id),
  );

  const panelProps = (panel: Panel) => ({
    dashboardId,
    panel,
    queryResult: queryResults.get(panel.id) ?? null,
    loading: loadingPanels.has(panel.id),
    onDuplicate: onDuplicatePanel,
    allResults,
    onClickDatum,
    readOnly,
  });

  // Scroll layout: panels flow vertically, sorted by layout Y position
  if (layoutMode === "scroll") {
    const sortedPanels = [...filteredPanels].sort((a, b) => {
      const la = layout.find((l) => l.i === a.id);
      const lb = layout.find((l) => l.i === b.id);
      return (la?.y ?? 0) - (lb?.y ?? 0);
    });

    return (
      <CanvasShell>
        <div
          ref={containerRef}
          className="flex flex-col"
          style={{ gap: gridConfig.margin[1] }}
        >
          {sortedPanels.map((panel) => {
            const li = layout.find((l) => l.i === panel.id);
            const h = (li?.h ?? 3) * gridConfig.rowHeight;
            return (
              <div key={panel.id} style={{ minHeight: h }}>
                <PanelErrorBoundary panelTitle={panel.title}>
                  <PanelContainer {...panelProps(panel)} />
                </PanelErrorBoundary>
              </div>
            );
          })}
        </div>
      </CanvasShell>
    );
  }

  return (
    <CanvasShell>
      <div ref={containerRef}>
        {containerWidth > 0 && (
          <GridLayout
            layout={layout}
            width={containerWidth}
            gridConfig={gridConfig}
            compactor={verticalCompactor}
            dragConfig={readOnly ? undefined : { handle: ".panel-drag-handle" }}
            onLayoutChange={readOnly ? undefined : handleLayoutChange}
          >
            {filteredPanels.map((panel) => (
              <div key={panel.id}>
                <PanelErrorBoundary panelTitle={panel.title}>
                  <PanelContainer {...panelProps(panel)} />
                </PanelErrorBoundary>
              </div>
            ))}
          </GridLayout>
        )}
      </div>
    </CanvasShell>
  );
}
