import { useCallback, useMemo } from "react";
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
import type { LayoutItem } from "@/types/dashboard";
import type { QueryResult } from "@/engine/types";

interface DashboardCanvasProps {
  dashboardId: string;
  queryResults: Map<string, QueryResult>;
  loadingPanels: Set<string>;
}

const GRID_CONFIG = {
  cols: 12,
  rowHeight: 80,
  margin: [12, 12] as const,
  containerPadding: [0, 0] as const,
  maxRows: Infinity,
};

export function DashboardCanvas({
  dashboardId,
  queryResults,
  loadingPanels,
}: DashboardCanvasProps) {
  const dashboard = useDashboardStore((s) => s.dashboards[dashboardId]);
  const updateLayout = useDashboardStore((s) => s.updateLayout);
  const [containerRef, containerWidth] = useContainerWidth();

  const layout: readonly RGLLayoutItem[] = useMemo(
    () =>
      dashboard?.layout.map((l) => ({
        i: l.i,
        x: l.x,
        y: l.y,
        w: l.w,
        h: l.h,
        minW: l.minW ?? 2,
        minH: l.minH ?? 2,
      })) ?? [],
    [dashboard?.layout],
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

  return (
    <div ref={containerRef} className="flex-1">
      {containerWidth > 0 && (
        <GridLayout
          layout={layout}
          width={containerWidth}
          gridConfig={GRID_CONFIG}
          compactor={verticalCompactor}
          dragConfig={{ handle: ".panel-drag-handle" }}
          onLayoutChange={handleLayoutChange}
        >
          {dashboard.panels.map((panel) => (
            <div key={panel.id}>
              <PanelErrorBoundary panelTitle={panel.title}>
                <PanelContainer
                  dashboardId={dashboardId}
                  panel={panel}
                  queryResult={queryResults.get(panel.id) ?? null}
                  loading={loadingPanels.has(panel.id)}
                />
              </PanelErrorBoundary>
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  );
}
