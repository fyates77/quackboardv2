import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useDashboardStore } from "@/stores/dashboard-store";

export const Route = createFileRoute("/dashboards/")({
  component: DashboardListPage,
});

function DashboardListPage() {
  const { dashboards, createDashboard } = useDashboardStore();
  const dashList = Object.values(dashboards).sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  );

  const handleCreate = () => {
    createDashboard("Untitled Dashboard");
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboards</h1>
          <p className="text-muted-foreground">
            Create and manage your SQL-powered dashboards
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Dashboard
        </Button>
      </div>

      {dashList.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardContent className="text-center">
            <p className="text-lg font-medium">No dashboards yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first dashboard to get started
            </p>
            <Button className="mt-4" onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dashList.map((dash) => (
            <Link
              key={dash.id}
              to="/dashboards/$dashboardId"
              params={{ dashboardId: dash.id }}
            >
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">{dash.name}</CardTitle>
                  <CardDescription>
                    {dash.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{dash.panels.length} panels</span>
                    <span>
                      Updated{" "}
                      {new Date(dash.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
