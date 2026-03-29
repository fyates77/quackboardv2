import { createFileRoute } from "@tanstack/react-router";
import { useDashboardStore } from "@/stores/dashboard-store";
import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar";
import { DashboardCanvas } from "@/components/dashboard/dashboard-canvas";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/dashboards/$dashboardId")({
  component: DashboardEditorPage,
});

function DashboardEditorPage() {
  const { dashboardId } = Route.useParams();
  const dashboard = useDashboardStore((s) => s.dashboards[dashboardId]);
  const addPanel = useDashboardStore((s) => s.addPanel);

  if (!dashboard) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Dashboard not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardToolbar dashboard={dashboard} />

      {dashboard.panels.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed">
          <div className="text-center">
            <p className="text-lg font-medium">Empty dashboard</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a panel to start building your dashboard
            </p>
            <Button
              className="mt-4"
              onClick={() => addPanel(dashboardId)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Panel
            </Button>
          </div>
        </div>
      ) : (
        <DashboardCanvas dashboardId={dashboardId} />
      )}
    </div>
  );
}
