import { useMemo } from "react";
import type { TextStyle } from "@/types/dashboard";

interface MarkdownPanelProps {
  content: string;
  textStyle?: TextStyle;
  panelResults?: Map<string, { rows: Record<string, unknown>[]; rowCount: number }>;
}

export function resolveTemplateVariables(
  text: string,
  panelResults?: Map<string, { rows: Record<string, unknown>[]; rowCount: number }>,
): string {
  if (!panelResults) return text;
  return text.replace(/\{\{panels\.(\w+)\.(\w+)\}\}/g, (_match, panelId, field) => {
    const result = panelResults.get(panelId);
    if (!result) return `{{panels.${panelId}.${field}}}`;
    if (field === "rowCount") return String(result.rowCount);
    if (result.rows.length > 0 && field in result.rows[0]) {
      return String(result.rows[0][field] ?? "");
    }
    return `{{panels.${panelId}.${field}}}`;
  });
}

function renderInline(line: string): string {
  return line
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    .replace(/`(.+?)`/g, "<code style=\"font-family:monospace;font-size:0.875em;background:rgba(128,128,128,0.15);padding:0.1em 0.35em;border-radius:3px\">$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;text-underline-offset:2px">$1</a>');
}

function renderMarkdown(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  let ulOpen = false;
  let olOpen = false;
  let paraBuffer: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  function flushPara() {
    if (paraBuffer.length > 0) {
      out.push(`<p style="margin:0 0 0.75em">${renderInline(paraBuffer.join(" "))}</p>`);
      paraBuffer = [];
    }
  }
  function closeUl() { if (ulOpen) { out.push("</ul>"); ulOpen = false; } }
  function closeOl() { if (olOpen) { out.push("</ol>"); olOpen = false; } }
  function closeLists() { closeUl(); closeOl(); }

  for (const raw of lines) {
    const trimmed = raw.trim();

    // Code block fence
    if (trimmed.startsWith("```")) {
      if (!inCodeBlock) {
        flushPara(); closeLists();
        inCodeBlock = true;
        codeLines = [];
      } else {
        out.push(`<pre style="background:rgba(128,128,128,0.12);border-radius:6px;padding:0.75em 1em;overflow:auto;margin:0 0 0.75em;font-family:monospace;font-size:0.8em"><code>${codeLines.join("\n")}</code></pre>`);
        inCodeBlock = false;
        codeLines = [];
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(raw.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
      continue;
    }

    if (trimmed === "") { flushPara(); closeLists(); continue; }
    if (/^---+$/.test(trimmed)) {
      flushPara(); closeLists();
      out.push('<hr style="border:none;border-top:1px solid currentColor;opacity:0.2;margin:1em 0" />');
      continue;
    }

    // Headings h1–h4
    const hm = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (hm) {
      flushPara(); closeLists();
      const level = hm[1].length;
      const sizes = ["2em", "1.5em", "1.25em", "1.1em"];
      const size = sizes[level - 1] ?? "1em";
      out.push(
        `<h${level} style="font-size:${size};font-weight:var(--text-heading-weight,700);color:var(--text-heading-color,currentColor);margin:0.75em 0 0.4em;line-height:1.2">${renderInline(hm[2])}</h${level}>`,
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushPara(); closeLists();
      out.push(
        `<blockquote style="border-left:3px solid currentColor;opacity:0.85;margin:0 0 0.75em;padding:0.25em 0 0.25em 1em;font-style:italic">${renderInline(trimmed.slice(2))}</blockquote>`,
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      flushPara(); closeOl();
      if (!ulOpen) { out.push('<ul style="margin:0 0 0.75em;padding-left:1.5em;list-style:disc">'); ulOpen = true; }
      out.push(`<li style="margin:0.2em 0">${renderInline(trimmed.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }

    // Ordered list
    const olm = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (olm) {
      flushPara(); closeUl();
      if (!olOpen) { out.push('<ol style="margin:0 0 0.75em;padding-left:1.5em;list-style:decimal">'); olOpen = true; }
      out.push(`<li style="margin:0.2em 0">${renderInline(olm[2])}</li>`);
      continue;
    }

    closeLists();
    paraBuffer.push(trimmed);
  }

  flushPara();
  closeLists();
  return out.join("\n");
}

const MAX_WIDTH_MAP: Record<string, string> = {
  none: "none",
  narrow: "480px",
  prose: "65ch",
  wide: "900px",
};

export const FONT_FAMILIES: Record<string, string> = {
  "System": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "Serif": "Georgia, 'Times New Roman', serif",
  "Mono": "'Courier New', 'Fira Code', monospace",
  "Inter": "'Inter', system-ui, sans-serif",
  "Roboto": "'Roboto', sans-serif",
  "Lato": "'Lato', sans-serif",
  "Montserrat": "'Montserrat', sans-serif",
  "Playfair Display": "'Playfair Display', Georgia, serif",
  "Merriweather": "'Merriweather', Georgia, serif",
};

const GOOGLE_FONTS = new Set(["Inter", "Roboto", "Lato", "Montserrat", "Playfair Display", "Merriweather"]);
const loadedFonts = new Set<string>();

function ensureFontLoaded(fontName: string) {
  if (!GOOGLE_FONTS.has(fontName) || loadedFonts.has(fontName)) return;
  loadedFonts.add(fontName);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

export function MarkdownPanel({ content, textStyle = {}, panelResults }: MarkdownPanelProps) {
  const {
    fontFamily = "System",
    fontSize = 14,
    fontWeight = "400",
    color,
    align = "left",
    lineHeight = 1.6,
    letterSpacing = 0,
    maxWidth = "none",
    headingColor,
    headingWeight = "700",
  } = textStyle;

  if (FONT_FAMILIES[fontFamily] && GOOGLE_FONTS.has(fontFamily)) {
    ensureFontLoaded(fontFamily);
  }

  const resolvedFont = FONT_FAMILIES[fontFamily] ?? fontFamily;

  const html = useMemo(() => {
    const resolved = resolveTemplateVariables(content, panelResults);
    return renderMarkdown(resolved);
  }, [content, panelResults]);

  if (!content.trim()) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Click to add text content
      </div>
    );
  }

  const maxW = MAX_WIDTH_MAP[maxWidth] ?? "none";

  return (
    <div className="h-full overflow-auto" style={{ padding: "1rem" }}>
      <div
        style={{
          fontFamily: resolvedFont,
          fontSize: `${fontSize}px`,
          fontWeight,
          color: color ?? "currentColor",
          textAlign: align,
          lineHeight,
          letterSpacing: letterSpacing ? `${letterSpacing}em` : undefined,
          maxWidth: maxW,
          margin: maxW !== "none" ? "0 auto" : undefined,
          "--text-heading-color": headingColor ?? "currentColor",
          "--text-heading-weight": headingWeight,
        } as React.CSSProperties}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
