import { useMemo } from "react";

interface MarkdownPanelProps {
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

function renderMarkdown(text: string): string {
  const lines = text.split("\n");
  const htmlParts: string[] = [];
  let inList = false;
  let paragraphBuffer: string[] = [];

  function flushParagraph() {
    if (paragraphBuffer.length > 0) {
      const content = paragraphBuffer.join(" ");
      htmlParts.push(`<p>${renderInline(content)}</p>`);
      paragraphBuffer = [];
    }
  }

  function closeList() {
    if (inList) {
      htmlParts.push("</ul>");
      inList = false;
    }
  }

  function renderInline(line: string): string {
    return (
      line
        // Bold
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        // Italic
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        // Inline code
        .replace(/`(.+?)`/g, "<code>$1</code>")
        // Links
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    );
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // Blank line — flush paragraph and close list
    if (trimmed === "") {
      flushParagraph();
      closeList();
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      flushParagraph();
      closeList();
      htmlParts.push("<hr />");
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      closeList();
      const level = headingMatch[1].length;
      htmlParts.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    // List items
    if (trimmed.startsWith("- ")) {
      flushParagraph();
      if (!inList) {
        htmlParts.push("<ul>");
        inList = true;
      }
      htmlParts.push(`<li>${renderInline(trimmed.slice(2))}</li>`);
      continue;
    }

    // Regular text — accumulate into paragraph
    closeList();
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  closeList();

  return htmlParts.join("\n");
}

export function MarkdownPanel({ content, panelResults }: MarkdownPanelProps) {
  const html = useMemo(() => {
    const resolved = resolveTemplateVariables(content, panelResults);
    return renderMarkdown(resolved);
  }, [content, panelResults]);

  if (!content.trim()) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        No content
      </div>
    );
  }

  return (
    <div
      className="prose prose-sm dark:prose-invert h-full overflow-auto p-4"
      style={{
        maxWidth: "none",
        lineHeight: 1.6,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
