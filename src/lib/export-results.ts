import type { QueryResult } from "@/engine/types";

/** Export query results as a CSV file download. */
export function exportResultsAsCsv(result: QueryResult, filename = "results") {
  const header = result.columns.map((c) => escapeCsvField(c.name)).join(",");
  const rows = result.rows.map((row) =>
    result.columns
      .map((c) => escapeCsvField(String(row[c.name] ?? "")))
      .join(","),
  );
  const csv = [header, ...rows].join("\n");
  downloadFile(csv, `${filename}.csv`, "text/csv");
}

/** Export query results as a JSON file download. */
export function exportResultsAsJson(
  result: QueryResult,
  filename = "results",
) {
  const json = JSON.stringify(result.rows, null, 2);
  downloadFile(json, `${filename}.json`, "application/json");
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
