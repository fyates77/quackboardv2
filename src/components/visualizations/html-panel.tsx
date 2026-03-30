import { useMemo } from "react";

interface HtmlPanelProps {
  content: string;
  /** Map of panel results for template variable resolution */
  panelResults?: Map<string, { rows: Record<string, unknown>[]; rowCount: number }>;
}

function resolveTemplateVariables(
  text: string,
  panelResults?: Map<string, { rows: Record<string, unknown>[]; rowCount: number }>,
): string {
  if (!panelResults) return text;

  return text.replace(/\{\{panels\.(\w+)\.(\w+)\}\}/g, (_match, panelId, field) => {
    const result = panelResults.get(panelId);
    if (!result) return `{{panels.${panelId}.${field}}}`;

    if (field === "rowCount") return String(result.rowCount);

    // Look up the field as a column name from the first row
    if (result.rows.length > 0 && field in result.rows[0]) {
      return String(result.rows[0][field] ?? "");
    }

    return `{{panels.${panelId}.${field}}}`;
  });
}

export function HtmlPanel({ content, panelResults }: HtmlPanelProps) {
  const html = useMemo(
    () => resolveTemplateVariables(content, panelResults),
    [content, panelResults],
  );

  if (!content.trim()) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        No content
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-auto p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
