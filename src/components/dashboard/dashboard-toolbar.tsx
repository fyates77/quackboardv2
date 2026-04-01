import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Plus, Trash2, Pencil, Check, X, ArrowLeft, Palette,
  LayoutGrid, AlignJustify, Eye, Monitor, FileJson, Settings2,
  PlusSquare, Filter, SlidersHorizontal, Layers,
} from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { Button } from "@/components/ui/button";
import { exportDashboards } from "@/lib/export-import";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Dashboard, DashboardTheme, SiteHeader } from "@/types/dashboard";

interface DashboardToolbarProps {
  dashboard: Dashboard;
  /** Called when "Add Filter" is clicked (if parent handles it) */
  onAddFilter?: () => void;
  /** Called when "Add Parameter" is clicked */
  onAddParameter?: () => void;
  /** Called when "Add Tab" is clicked */
  onAddTab?: () => void;
}

export function DashboardToolbar({
  dashboard,
  onAddFilter,
  onAddParameter,
  onAddTab,
}: DashboardToolbarProps) {
  const navigate = useNavigate();
  const addPanel = useDashboardStore((s) => s.addPanel);
  const renameDashboard = useDashboardStore((s) => s.renameDashboard);
  const deleteDashboard = useDashboardStore((s) => s.deleteDashboard);
  const updateDashboardTheme = useDashboardStore((s) => s.updateDashboardTheme);
  const updateSiteHeader = useDashboardStore((s) => s.updateSiteHeader);
  const setLayoutMode = useDashboardStore((s) => s.setLayoutMode);

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(dashboard.name);
  const [themeOpen, setThemeOpen] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(false);

  const commitName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== dashboard.name) {
      renameDashboard(dashboard.id, trimmed);
    } else {
      setNameDraft(dashboard.name);
    }
    setEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`Delete "${dashboard.name}"? This cannot be undone.`)) {
      deleteDashboard(dashboard.id);
      navigate({ to: "/dashboards" });
    }
  };

  const handleExport = () => exportDashboards();

  return (
    <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border/30 bg-card/60 px-3 backdrop-blur-sm">

      {/* Back to dashboards */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground"
        onClick={() => navigate({ to: "/dashboards" })}
        title="All Dashboards"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
      </Button>

      <div className="h-4 w-px bg-border/40 shrink-0" />

      {/* Dashboard name — inline editable */}
      {editing ? (
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => { e.preventDefault(); commitName(); }}
        >
          <input
            autoFocus
            className="rounded border border-border/60 bg-background px-2 py-0.5 text-sm font-semibold outline-none focus:ring-1 focus:ring-ring"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setNameDraft(dashboard.name); setEditing(false); }
            }}
          />
          <Button type="submit" variant="ghost" size="icon" className="h-6 w-6">
            <Check className="h-3 w-3" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6"
            onClick={() => { setNameDraft(dashboard.name); setEditing(false); }}>
            <X className="h-3 w-3" />
          </Button>
        </form>
      ) : (
        <button
          className="flex items-center gap-1.5 group"
          onDoubleClick={() => setEditing(true)}
          onClick={() => setEditing(true)}
          title="Click to rename"
        >
          <span className="text-sm font-semibold">{dashboard.name}</span>
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      <div className="h-4 w-px bg-border/40 shrink-0 mx-1" />

      {/* ── Menu bar ── */}

      {/* File menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs">
            File
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Dashboard</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleExport}>
            <FileJson className="h-3.5 w-3.5" />
            Export JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Dashboard…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs">
            Edit
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Dashboard</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Layout</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setLayoutMode(dashboard.id, "grid")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Grid layout
            {dashboard.layoutMode !== "scroll" && (
              <span className="ml-auto text-[10px] text-primary">✓</span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setLayoutMode(dashboard.id, "scroll")}
          >
            <AlignJustify className="h-3.5 w-3.5" />
            Scroll layout
            {dashboard.layoutMode === "scroll" && (
              <span className="ml-auto text-[10px] text-primary">✓</span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs">
            View
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => setThemeOpen(true)}>
            <Palette className="h-3.5 w-3.5" />
            Dashboard Theme…
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setHeaderOpen(true)}>
            <Monitor className="h-3.5 w-3.5" />
            Site Header…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/view/$dashboardId" params={{ dashboardId: dashboard.id }}>
              <Eye className="h-3.5 w-3.5" />
              Preview (consumer view)
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs">
            Add
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => addPanel(dashboard.id)}>
            <PlusSquare className="h-3.5 w-3.5" />
            Panel
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onAddFilter}>
            <Filter className="h-3.5 w-3.5" />
            Filter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onAddParameter}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Parameter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onAddTab}>
            <Layers className="h-3.5 w-3.5" />
            Tab
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1" />

      {/* Quick-access: Add Panel */}
      <Button size="sm" className="h-7 text-xs" onClick={() => addPanel(dashboard.id)}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        Panel
      </Button>

      {/* Quick-access: Settings — opens Theme dialog */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground"
        title="Dashboard settings"
        onClick={() => setThemeOpen(true)}
      >
        <Settings2 className="h-3.5 w-3.5" />
      </Button>

      {/* Preview */}
      <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
        <Link to="/view/$dashboardId" params={{ dashboardId: dashboard.id }}>
          <Eye className="mr-1 h-3.5 w-3.5" />
          Preview
        </Link>
      </Button>

      {/* Theme dialog */}
      <Dialog open={themeOpen} onOpenChange={setThemeOpen}>
        <DialogContent className="max-w-md">
          <ThemeEditor
            theme={dashboard.theme}
            onChange={(t) => updateDashboardTheme(dashboard.id, t)}
          />
        </DialogContent>
      </Dialog>

      {/* Site header dialog */}
      <Dialog open={headerOpen} onOpenChange={setHeaderOpen}>
        <DialogContent className="max-w-md">
          <SiteHeaderEditor
            header={dashboard.siteHeader}
            onChange={(h) => updateSiteHeader(dashboard.id, h)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Site Header Editor ───────────────────────────── */

function SiteHeaderEditor({
  header,
  onChange,
}: {
  header?: SiteHeader;
  onChange: (h: Partial<SiteHeader>) => void;
}) {
  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-semibold">Site Header (Consumer View)</h3>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Title</label>
        <input
          type="text"
          placeholder="Defaults to dashboard name"
          value={header?.title || ""}
          onChange={(e) => onChange({ title: e.target.value || undefined })}
          className="w-full rounded border border-border/40 bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Subtitle</label>
        <input
          type="text"
          placeholder="Optional subtitle"
          value={header?.subtitle || ""}
          onChange={(e) => onChange({ subtitle: e.target.value || undefined })}
          className="w-full rounded border border-border/40 bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Logo URL</label>
        <input
          type="text"
          placeholder="https://..."
          value={header?.logoUrl || ""}
          onChange={(e) => onChange({ logoUrl: e.target.value || undefined })}
          className="w-full rounded border border-border/40 bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Background</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={header?.background?.startsWith("#") ? header.background : "#1e293b"}
            onChange={(e) => onChange({ background: e.target.value })}
            className="h-7 w-7 cursor-pointer rounded border border-border/40"
          />
          <input
            type="text"
            placeholder="Color or gradient"
            value={header?.background || ""}
            onChange={(e) => onChange({ background: e.target.value || undefined })}
            className="flex-1 rounded border border-border/40 bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Text Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={header?.textColor || "#ffffff"}
            onChange={(e) => onChange({ textColor: e.target.value })}
            className="h-7 w-7 cursor-pointer rounded border border-border/40"
          />
          <input
            type="text"
            placeholder="#ffffff"
            value={header?.textColor || ""}
            onChange={(e) => onChange({ textColor: e.target.value || undefined })}
            className="flex-1 rounded border border-border/40 bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={!!header?.showTimestamp}
          onChange={(e) => onChange({ showTimestamp: e.target.checked || undefined })}
          className="rounded"
        />
        Show last updated timestamp
      </label>

      {header && Object.values(header).some(Boolean) && (
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
          onClick={() => onChange({ title: undefined, subtitle: undefined, logoUrl: undefined, background: undefined, textColor: undefined, showTimestamp: undefined, links: undefined })}
        >
          Clear header
        </button>
      )}
    </div>
  );
}

/* ── Theme Editor ──────────────────────────────── */

const FONT_OPTIONS = [
  { label: "System Default", value: "system-ui, sans-serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { label: "Merriweather", value: "'Merriweather', serif" },
];

const SPACING_OPTIONS = [
  { label: "Compact", value: 0.5 },
  { label: "Normal", value: 1 },
  { label: "Spacious", value: 1.5 },
  { label: "Loose", value: 2 },
];

function ThemeEditor({
  theme,
  onChange,
}: {
  theme?: DashboardTheme;
  onChange: (t: Partial<DashboardTheme>) => void;
}) {
  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-semibold">Dashboard Theme</h3>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Accent Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={theme?.accentColor || "#e8910c"}
            onChange={(e) => onChange({ accentColor: e.target.value })}
            className="h-8 w-8 cursor-pointer rounded border border-border/40"
          />
          <input
            type="text"
            value={theme?.accentColor || ""}
            placeholder="Default (amber)"
            onChange={(e) => onChange({ accentColor: e.target.value || undefined })}
            className="flex-1 rounded border border-border/40 bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Font Family</label>
        <select
          value={theme?.fontFamily || ""}
          onChange={(e) => onChange({ fontFamily: e.target.value || undefined })}
          className="w-full rounded border border-border/40 bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Default</option>
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Canvas Background</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={theme?.canvasBackground?.startsWith("#") ? theme.canvasBackground : "#f5f5f4"}
            onChange={(e) => onChange({ canvasBackground: e.target.value })}
            className="h-8 w-8 cursor-pointer rounded border border-border/40"
          />
          <input
            type="text"
            value={theme?.canvasBackground || ""}
            placeholder="Color, gradient, or image URL"
            onChange={(e) => onChange({ canvasBackground: e.target.value || undefined })}
            className="flex-1 rounded border border-border/40 bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Grid Spacing</label>
        <div className="flex gap-1">
          {SPACING_OPTIONS.map((s) => (
            <button
              key={s.value}
              className={cn(
                "flex-1 rounded border px-2 py-1.5 text-xs transition-colors",
                (theme?.spacingMultiplier ?? 1) === s.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/40 text-muted-foreground hover:text-foreground",
              )}
              onClick={() => onChange({ spacingMultiplier: s.value })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Custom CSS (advanced)</label>
        <textarea
          className="w-full rounded border border-border/40 bg-background p-2 text-xs font-mono outline-none focus:ring-1 focus:ring-ring"
          rows={4}
          placeholder={`/* Scoped to this dashboard */\n.glass { backdrop-filter: blur(20px); }`}
          value={theme?.customCSS || ""}
          onChange={(e) => onChange({ customCSS: e.target.value || undefined })}
        />
      </div>

      {theme && Object.keys(theme).length > 0 && (
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
          onClick={() => onChange({
            accentColor: undefined,
            fontFamily: undefined,
            canvasBackground: undefined,
            spacingMultiplier: undefined,
            customCSS: undefined,
          })}
        >
          Reset to default theme
        </button>
      )}
    </div>
  );
}
