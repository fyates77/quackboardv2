import { useDashboardStore } from "@/stores/dashboard-store";
import type { Dashboard } from "@/types/dashboard";

interface ExportPayload {
  version: 1;
  exportedAt: string;
  dashboards: Dashboard[];
}

export function exportDashboards(): void {
  const { dashboards } = useDashboardStore.getState();
  const payload: ExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    dashboards: Object.values(dashboards),
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `quackboard-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSingleDashboard(id: string): void {
  const { dashboards } = useDashboardStore.getState();
  const dash = dashboards[id];
  if (!dash) return;

  const payload: ExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    dashboards: [dash],
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${dash.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importDashboards(file: File): Promise<number> {
  const text = await file.text();
  const payload = JSON.parse(text) as ExportPayload;

  if (payload.version !== 1 || !Array.isArray(payload.dashboards)) {
    throw new Error("Invalid export file format");
  }

  const store = useDashboardStore.getState();
  let imported = 0;

  for (const dash of payload.dashboards) {
    if (
      !dash.id ||
      !dash.name ||
      !Array.isArray(dash.panels) ||
      !Array.isArray(dash.layout)
    ) {
      continue;
    }

    // If a dashboard with this ID already exists, generate a new name
    if (store.dashboards[dash.id]) {
      dash.name = `${dash.name} (imported)`;
    }

    // Use the store's internal setter directly
    useDashboardStore.setState((state) => ({
      dashboards: { ...state.dashboards, [dash.id]: dash },
    }));

    imported++;
  }

  return imported;
}
