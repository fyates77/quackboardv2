import { useDashboardStore } from "@/stores/dashboard-store";
import type { Dashboard, Panel } from "@/types/dashboard";

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

/** Render a static panel card for the HTML export */
function renderStaticPanel(panel: Panel): string {
  const isContentPanel = ["markdown", "image", "embed", "html"].includes(panel.visualization.type);
  let content = "";

  if (panel.visualization.type === "markdown" && panel.markdownContent) {
    // Simple markdown → HTML (headings, bold, italic, lists)
    content = panel.markdownContent
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
      .replace(/\n\n/g, "<br><br>");
  } else if (panel.visualization.type === "image" && panel.imageUrl) {
    content = `<img src="${panel.imageUrl}" style="max-width:100%;max-height:100%;object-fit:contain;" alt="${panel.title}" />`;
  } else if (panel.visualization.type === "embed" && panel.embedUrl) {
    content = `<p style="color:#888;font-size:12px;">Embedded content: <a href="${panel.embedUrl}" target="_blank">${panel.embedUrl}</a></p>`;
  } else if (panel.visualization.type === "html" && panel.htmlContent) {
    content = panel.htmlContent;
  } else if (isContentPanel) {
    content = `<p style="color:#888;font-size:12px;">Content panel</p>`;
  } else if (panel.query.sql) {
    content = `<p style="color:#888;font-size:12px;font-style:italic;">⚡ Live query panel — requires Quackboard to render.<br>Query: <code style="font-size:10px;">${panel.query.sql.slice(0, 80)}${panel.query.sql.length > 80 ? "…" : ""}</code></p>`;
  } else {
    content = `<p style="color:#888;font-size:12px;font-style:italic;">${panel.visualization.type} panel</p>`;
  }

  const bg = panel.style?.background ?? "#fff";
  const border = panel.style?.borderColor ? `1px solid ${panel.style.borderColor}` : "1px solid #e2e8f0";
  const radius = panel.style?.borderRadius !== undefined ? `${panel.style.borderRadius}px` : "8px";
  const opacity = panel.style?.opacity !== undefined ? panel.style.opacity : 1;

  return `
    <div class="panel" style="background:${bg};border:${border};border-radius:${radius};opacity:${opacity};overflow:hidden;display:flex;flex-direction:column;">
      ${!panel.style?.chromeless ? `<div class="panel-title">${panel.title}</div>` : ""}
      <div class="panel-body">${content}</div>
    </div>`;
}

/** Export a dashboard as a self-contained HTML snapshot. Charts and live queries
 *  are replaced with placeholders; markdown, image, embed, and KPI panels with
 *  literal values render. */
export function exportAsStandaloneHTML(dashboard: Dashboard): void {
  const panelCards = dashboard.panels.map((p) => renderStaticPanel(p)).join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${dashboard.name} — Quackboard Export</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${dashboard.theme?.fontFamily ?? "Inter, system-ui, sans-serif"};
      background: ${dashboard.theme?.canvasBackground ?? "#f8fafc"};
      color: #1e293b;
      padding: 24px;
      min-height: 100vh;
    }
    h1.page-title {
      font-size: 20px; font-weight: 600; margin-bottom: 6px; color: #0f172a;
    }
    p.page-desc {
      font-size: 13px; color: #64748b; margin-bottom: 24px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .panel {
      min-height: 160px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .panel-title {
      font-size: 12px; font-weight: 600; color: #475569;
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
      background: rgba(248,250,252,0.8);
    }
    .panel-body {
      padding: 12px; flex: 1;
      font-size: 13px; line-height: 1.6;
    }
    .panel-body h1 { font-size: 22px; margin-bottom: 8px; }
    .panel-body h2 { font-size: 18px; margin-bottom: 6px; }
    .panel-body h3 { font-size: 15px; margin-bottom: 4px; }
    .panel-body ul { padding-left: 18px; }
    footer {
      text-align: center; margin-top: 40px;
      font-size: 11px; color: #94a3b8;
    }
    ${dashboard.theme?.customCSS ?? ""}
  </style>
</head>
<body>
  <h1 class="page-title">${dashboard.name}</h1>
  ${dashboard.description ? `<p class="page-desc">${dashboard.description}</p>` : ""}
  <div class="grid">
${panelCards}
  </div>
  <footer>
    Powered by <strong>Quackboard</strong> · Exported ${new Date().toLocaleDateString()}
  </footer>
  <script>
    window.__QUACKBOARD_EXPORT__ = ${JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), dashboards: [dashboard] })};
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${dashboard.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.html`;
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
