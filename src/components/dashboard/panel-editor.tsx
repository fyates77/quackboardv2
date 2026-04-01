import { useCallback, useEffect, useState } from "react";
import { Play, Loader2, X, AlertCircle, ChevronDown, ChevronRight, Maximize2, Download, Plus, Info, Settings } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useUIStore } from "@/stores/ui-store";
import { useQuery } from "@/engine/use-query";
import { inferVisualization } from "@/lib/viz-defaults";
import { applyFilters } from "@/lib/sql-template";
import { createId } from "@/lib/id";
import { cn } from "@/lib/utils";
import { exportResultsAsCsv, exportResultsAsJson } from "@/lib/export-results";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SqlEditor } from "@/components/query/sql-editor";
import { JsEditor } from "@/components/query/js-editor";
import { ResultsTable } from "@/components/query/results-table";
import { VizConfigPanel } from "@/components/visualizations/viz-config-panel";
import { SchemaBrowser } from "@/components/data-sources/schema-browser";
import type { QueryResult } from "@/engine/types";
import type {
  DashboardFilter,
  DashboardTab,
  Panel,
  PanelAnnotation,
  PanelStyle,
  VisualizationType,
  ColumnMapping,
  VisualizationOptions,
  VisibilityCondition,
} from "@/types/dashboard";

interface PanelEditorProps {
  dashboardId: string;
  panel: Panel;
  filters?: DashboardFilter[];
  filterValues?: Record<string, string>;
  parameterValues?: Record<string, string | number | boolean>;
  tabs?: DashboardTab[];
  onQueryResult: (panelId: string, result: QueryResult | null) => void;
}

/** Panel types that don't need a SQL query */
const CONTENT_PANEL_TYPES = new Set(["markdown", "image", "embed", "html", "nav-bar"]);

export function PanelEditor({
  dashboardId,
  panel,
  filters = [],
  filterValues = {},
  parameterValues = {},
  tabs = [],
  onQueryResult,
}: PanelEditorProps) {
  const updatePanelQuery = useDashboardStore((s) => s.updatePanelQuery);
  const updatePanelApplyFilters = useDashboardStore(
    (s) => s.updatePanelApplyFilters,
  );
  const updatePanelVisualization = useDashboardStore(
    (s) => s.updatePanelVisualization,
  );
  const updatePanel = useDashboardStore((s) => s.updatePanel);
  const setActivePanelId = useUIStore((s) => s.setActivePanelId);

  const [sqlDraft, setSqlDraft] = useState(panel.query.sql);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [expandedOpen, setExpandedOpen] = useState(false);
  const { data, loading, error, execute } = useQuery();

  // Sync draft when switching panels
  useEffect(() => {
    setSqlDraft(panel.query.sql);
  }, [panel.id, panel.query.sql]);

  // Push results to parent whenever a query actually returns data.
  // Skip null — the hook starts with null and we don't want to clear
  // an existing result just because the editor opened.
  useEffect(() => {
    if (data) {
      onQueryResult(panel.id, data);
    }
  }, [panel.id, data, onQueryResult]);

  const handleRun = useCallback(async () => {
    const trimmed = sqlDraft.trim();
    if (!trimmed) return;

    // Persist SQL to store (with template placeholders intact)
    updatePanelQuery(dashboardId, panel.id, trimmed);

    // Apply dashboard filters and parameters (if enabled for this panel)
    const resolvedSql =
      panel.applyDashboardFilters !== false
        ? applyFilters(trimmed, filters, filterValues, parameterValues)
        : trimmed;
    const result = await execute(resolvedSql);

    // Auto-detect viz on first run if mapping is empty
    if (
      result &&
      !panel.visualization.mapping.x &&
      !panel.visualization.mapping.value &&
      !panel.visualization.mapping.category
    ) {
      const inferred = inferVisualization(result.columns);
      updatePanelVisualization(dashboardId, panel.id, inferred);
    }
  }, [
    sqlDraft,
    dashboardId,
    panel.id,
    panel.visualization.mapping,
    filterValues,
    execute,
    updatePanelQuery,
    updatePanelVisualization,
  ]);

  const handleChangeType = useCallback(
    (type: VisualizationType) => {
      updatePanelVisualization(dashboardId, panel.id, { type });
    },
    [dashboardId, panel.id, updatePanelVisualization],
  );

  const handleChangeMapping = useCallback(
    (mapping: ColumnMapping) => {
      updatePanelVisualization(dashboardId, panel.id, { mapping });
    },
    [dashboardId, panel.id, updatePanelVisualization],
  );

  const handleChangeOptions = useCallback(
    (options: VisualizationOptions) => {
      updatePanelVisualization(dashboardId, panel.id, { options });
    },
    [dashboardId, panel.id, updatePanelVisualization],
  );

  const isContentPanel = CONTENT_PANEL_TYPES.has(panel.visualization.type);
  const columns = data?.columns.map((c) => c.name) ?? [];

  return (
    <div className="glass flex h-full flex-col border-l border-border/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-3 py-2">
        <h3 className="text-sm font-semibold truncate">{panel.title}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setActivePanelId(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Tabbed layout ── */}
      <Tabs defaultValue="query" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="shrink-0 px-1">
          <TabsTrigger value="query">Query</TabsTrigger>
          <TabsTrigger value="viz">Viz</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="h-3 w-3" />
          </TabsTrigger>
        </TabsList>

        {/* ── QUERY TAB ── */}
        <TabsContent value="query" className="flex flex-col overflow-hidden">
          <div className="flex flex-col overflow-hidden flex-1">

            {/* SQL editor (main area) */}
            {!isContentPanel && (
              <div className="flex flex-col flex-1 min-h-0 p-3 pb-2 gap-2">
                {/* Editor toolbar */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="flex-1 text-xs font-medium text-muted-foreground">SQL</span>
                  <Dialog open={expandedOpen} onOpenChange={setExpandedOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Expand editor">
                        <Maximize2 className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="flex h-[80vh] w-[80vw] max-w-5xl flex-col gap-0 p-0">
                      <div className="flex items-center justify-between border-b border-border/30 px-4 py-3 pr-12">
                        <h3 className="text-sm font-semibold">{panel.title} — SQL Editor</h3>
                      </div>
                      <div className="flex-1 overflow-hidden p-4">
                        <div className="h-full overflow-hidden rounded-lg border border-border/40">
                          <SqlEditor value={sqlDraft} onChange={setSqlDraft} onRun={() => { handleRun(); setExpandedOpen(false); }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-border/30 px-4 py-3">
                        <p className="text-xs text-muted-foreground">Cmd+Enter to run</p>
                        <Button size="sm" className="gap-1.5" onClick={() => { handleRun(); setExpandedOpen(false); }} disabled={loading}>
                          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                          Run
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" className="h-6 gap-1 text-xs" onClick={handleRun} disabled={loading}>
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                    Run
                  </Button>
                </div>

                {/* SQL editor — takes up remaining vertical space */}
                <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-border/40">
                  <SqlEditor value={sqlDraft} onChange={setSqlDraft} onRun={handleRun} />
                </div>

                {/* Toggles row */}
                <div className="flex items-center gap-3 shrink-0">
                  <ToggleSwitch
                    label="Filters"
                    checked={panel.applyDashboardFilters !== false}
                    onChange={() => updatePanelApplyFilters(dashboardId, panel.id, panel.applyDashboardFilters === false)}
                    title="Apply dashboard filters to this query"
                  />
                  <ToggleSwitch
                    label="Cross-filter"
                    checked={!!panel.crossFilterEnabled}
                    onChange={() => updatePanel(dashboardId, panel.id, { crossFilterEnabled: !panel.crossFilterEnabled })}
                    title="Clicking this chart filters other panels"
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mx-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive shrink-0">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <pre className="whitespace-pre-wrap">{error}</pre>
              </div>
            )}

            {/* Results (collapsible) */}
            {data && (
              <div className="border-t border-border/30 shrink-0">
                <button
                  className="flex w-full items-center gap-1 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setResultsOpen(!resultsOpen)}
                >
                  {resultsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <span className="flex-1 text-left">
                    Results — {data.rowCount.toLocaleString()} rows · {data.elapsed.toFixed(1)}ms
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-5 gap-1 px-1.5 text-[10px]"
                      onClick={() => exportResultsAsCsv(data, panel.title || "results")}>
                      <Download className="h-2.5 w-2.5" /> CSV
                    </Button>
                    <Button variant="ghost" size="sm" className="h-5 gap-1 px-1.5 text-[10px]"
                      onClick={() => exportResultsAsJson(data, panel.title || "results")}>
                      <Download className="h-2.5 w-2.5" /> JSON
                    </Button>
                  </div>
                </button>
                {resultsOpen && (
                  <div className="max-h-48 overflow-auto border-t border-border/30">
                    <ResultsTable result={data} />
                  </div>
                )}
              </div>
            )}

            {/* Schema browser (collapsible) */}
            <div className="border-t border-border/30 shrink-0">
              <SchemaBrowserCollapsible />
            </div>
          </div>
        </TabsContent>

        {/* ── VIZ TAB ── */}
        <TabsContent value="viz" className="overflow-auto p-3">
          {/* Content-panel editors live here */}
          {panel.visualization.type === "markdown" && (
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Markdown Content</label>
              <textarea
                className="w-full rounded-lg border border-border/40 bg-background p-2 text-sm font-mono outline-none focus:ring-1 focus:ring-ring"
                rows={12}
                placeholder={"# Heading\n\nWrite **markdown** here.\n\nUse {{panels.panelId.column}} for template variables."}
                value={panel.markdownContent ?? ""}
                onChange={(e) => updatePanel(dashboardId, panel.id, { markdownContent: e.target.value })}
              />
            </div>
          )}
          {panel.visualization.type === "image" && (
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Image URL</label>
              <input
                className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                placeholder="https://..."
                value={panel.imageUrl ?? ""}
                onChange={(e) => updatePanel(dashboardId, panel.id, { imageUrl: e.target.value })}
              />
            </div>
          )}
          {panel.visualization.type === "embed" && (
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Embed URL</label>
              <input
                className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                placeholder="https://..."
                value={panel.embedUrl ?? ""}
                onChange={(e) => updatePanel(dashboardId, panel.id, { embedUrl: e.target.value })}
              />
            </div>
          )}
          {panel.visualization.type === "html" && (
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-muted-foreground">HTML Content</label>
              <textarea
                className="w-full rounded-lg border border-border/40 bg-background p-2 text-sm font-mono outline-none focus:ring-1 focus:ring-ring"
                rows={10}
                placeholder={"<div>\n  Custom HTML content\n</div>"}
                value={panel.htmlContent ?? ""}
                onChange={(e) => updatePanel(dashboardId, panel.id, { htmlContent: e.target.value })}
              />
            </div>
          )}
          {panel.visualization.type === "custom" && (
            <CustomVizEditor dashboardId={dashboardId} panel={panel} />
          )}

          {/* Viz config for data panels */}
          <VizConfigPanel
            config={panel.visualization}
            result={data}
            onChangeType={handleChangeType}
            onChangeMapping={handleChangeMapping}
            onChangeOptions={handleChangeOptions}
            dashboardId={dashboardId}
          />
        </TabsContent>

        {/* ── STYLE TAB ── */}
        <TabsContent value="style" className="overflow-auto p-3 space-y-4">
          <PanelStyleEditor dashboardId={dashboardId} panelId={panel.id} style={panel.style} />
          <div className="border-t border-border/30 pt-3">
            <VisibilityEditor
              condition={panel.visibilityCondition}
              filters={filters}
              onChange={(cond) => updatePanel(dashboardId, panel.id, { visibilityCondition: cond })}
            />
          </div>
        </TabsContent>

        {/* ── CONFIG TAB ── */}
        <TabsContent value="config" className="overflow-auto p-3 space-y-4">
          {tabs.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Tab Assignment</p>
              <TabAssignment dashboardId={dashboardId} panelId={panel.id} tabs={tabs} />
            </div>
          )}

          {!isContentPanel && (
            <div>
              <DrilldownConfig
                panel={panel}
                columns={columns}
                onChange={(updates) => updatePanel(dashboardId, panel.id, updates)}
              />
            </div>
          )}

          {!isContentPanel && (
            <div className="pt-1">
              <AnnotationEditor
                annotations={panel.annotations ?? []}
                onChange={(annotations) =>
                  updatePanel(dashboardId, panel.id, { annotations: annotations.length > 0 ? annotations : undefined })
                }
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Small inline toggle switch ─────────────────────── */

function ToggleSwitch({
  label,
  checked,
  onChange,
  title,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  title?: string;
}) {
  return (
    <button
      className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      onClick={onChange}
      title={title}
    >
      <span
        className={cn(
          "inline-block h-3 w-5 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "block h-2.5 w-2.5 translate-y-[1px] rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[9px]" : "translate-x-[1px]",
          )}
        />
      </span>
      {label}
    </button>
  );
}

/* ── Collapsible schema browser ──────────────────────── */

function SchemaBrowserCollapsible() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        className="flex w-full items-center gap-1 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Tables
      </button>
      {open && (
        <div className="max-h-56 overflow-auto border-t border-border/30 px-2 pb-2">
          <SchemaBrowser />
        </div>
      )}
    </div>
  );
}

/* ── Panel Style Editor ─────────────────────────────── */

const SHADOW_OPTIONS = ["none", "sm", "md", "lg"] as const;

function PanelStyleEditor({
  dashboardId,
  panelId,
  style,
}: {
  dashboardId: string;
  panelId: string;
  style?: PanelStyle;
}) {
  const updatePanelStyle = useDashboardStore((s) => s.updatePanelStyle);
  const [open, setOpen] = useState(false);

  const set = (updates: Partial<PanelStyle>) =>
    updatePanelStyle(dashboardId, panelId, updates);

  return (
    <div>
      <button
        className="flex w-full items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        Panel Style
      </button>
      {open && (
        <div className="mt-2 space-y-3">
          {/* Show header toggle */}
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={!style?.chromeless}
              onChange={(e) => set({ chromeless: !e.target.checked })}
              className="rounded"
            />
            Show panel header
          </label>

          {/* Full width toggle */}
          <FullWidthToggle dashboardId={dashboardId} panelId={panelId} />

          {/* Background color */}
          <div>
            <label className="mb-1 block text-[10px] text-muted-foreground">
              Background
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={style?.background || "#ffffff"}
                onChange={(e) => set({ background: e.target.value })}
                className="h-7 w-7 cursor-pointer rounded border border-border/40"
              />
              <input
                type="text"
                placeholder="CSS color or gradient"
                value={style?.background || ""}
                onChange={(e) =>
                  set({ background: e.target.value || undefined })
                }
                className="flex-1 rounded border border-border/40 bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Background opacity */}
          {style?.background && (
            <div>
              <label className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Opacity</span>
                <span>{Math.round((style?.backgroundOpacity ?? 1) * 100)}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={style?.backgroundOpacity ?? 1}
                onChange={(e) =>
                  set({ backgroundOpacity: parseFloat(e.target.value) })
                }
                className="w-full"
              />
            </div>
          )}

          {/* Border */}
          <div>
            <label className="mb-1 block text-[10px] text-muted-foreground">
              Border
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={style?.borderColor || "#e5e7eb"}
                onChange={(e) => set({ borderColor: e.target.value })}
                className="h-7 w-7 cursor-pointer rounded border border-border/40"
              />
              <div className="flex flex-1 items-center gap-1">
                <input
                  type="range"
                  min={0}
                  max={4}
                  step={1}
                  value={style?.borderWidth ?? 0}
                  onChange={(e) =>
                    set({ borderWidth: parseInt(e.target.value) })
                  }
                  className="flex-1"
                />
                <span className="text-[10px] text-muted-foreground w-6 text-right">
                  {style?.borderWidth ?? 0}px
                </span>
              </div>
            </div>
          </div>

          {/* Border radius */}
          <div>
            <label className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Corner radius</span>
              <span>{style?.borderRadius ?? 12}px</span>
            </label>
            <input
              type="range"
              min={0}
              max={24}
              step={2}
              value={style?.borderRadius ?? 12}
              onChange={(e) =>
                set({ borderRadius: parseInt(e.target.value) })
              }
              className="w-full"
            />
          </div>

          {/* Padding */}
          <div>
            <label className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Padding</span>
              <span>{style?.padding ?? 8}px</span>
            </label>
            <input
              type="range"
              min={0}
              max={32}
              step={2}
              value={style?.padding ?? 8}
              onChange={(e) => set({ padding: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Shadow */}
          <div>
            <label className="mb-1 block text-[10px] text-muted-foreground">
              Shadow
            </label>
            <div className="flex gap-1">
              {SHADOW_OPTIONS.map((s) => (
                <button
                  key={s}
                  className={cn(
                    "flex-1 rounded border px-2 py-1 text-[10px] transition-colors",
                    (style?.shadow ?? "md") === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/40 text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => set({ shadow: s })}
                >
                  {s === "none" ? "None" : s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Title alignment */}
          {!style?.chromeless && (
            <div>
              <label className="mb-1 block text-[10px] text-muted-foreground">
                Title alignment
              </label>
              <div className="flex gap-1">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    className={cn(
                      "flex-1 rounded border px-2 py-1 text-[10px] capitalize transition-colors",
                      (style?.titleAlign ?? "left") === align
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/40 text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => set({ titleAlign: align })}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reset button */}
          {style && Object.keys(style).length > 0 && (
            <button
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline"
              onClick={() =>
                useDashboardStore
                  .getState()
                  .updatePanel(dashboardId, panelId, { style: undefined })
              }
            >
              Reset to default
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Visibility Editor ─────────────────────────────── */

function VisibilityEditor({
  condition,
  filters,
  onChange,
}: {
  condition?: VisibilityCondition;
  filters: DashboardFilter[];
  onChange: (cond: VisibilityCondition | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = condition?.type ?? "always";

  return (
    <div>
      <button
        className="flex w-full items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        Visibility
        {current !== "always" && (
          <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
            Conditional
          </span>
        )}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-col gap-1">
            {(["always", "filter", "query"] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 text-xs">
                <input
                  type="radio"
                  name="visibility"
                  checked={current === type}
                  onChange={() => {
                    if (type === "always") {
                      onChange(undefined);
                    } else {
                      onChange({ type });
                    }
                  }}
                  className="rounded"
                />
                {type === "always" && "Always visible"}
                {type === "filter" && "When filter has value"}
                {type === "query" && "When query returns rows"}
              </label>
            ))}
          </div>

          {current === "filter" && (
            <div>
              <label className="mb-1 block text-[10px] text-muted-foreground">
                Filter
              </label>
              <select
                value={condition?.filterName ?? ""}
                onChange={(e) =>
                  onChange({
                    type: "filter",
                    filterName: e.target.value || undefined,
                  })
                }
                className="w-full rounded border border-border/40 bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select a filter…</option>
                {filters.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {current === "query" && (
            <p className="text-[10px] text-muted-foreground">
              Panel is visible when its own query returns at least one row.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Tab Assignment ─────────────────────────────── */

function TabAssignment({
  dashboardId,
  panelId,
  tabs,
}: {
  dashboardId: string;
  panelId: string;
  tabs: DashboardTab[];
}) {
  const setTabs = useDashboardStore((s) => s.setTabs);

  const currentTab = tabs.find((t) => t.panelIds.includes(panelId));

  const handleAssign = (tabId: string) => {
    const updated = tabs.map((t) => {
      const ids = t.panelIds.filter((id) => id !== panelId);
      if (t.id === tabId) {
        ids.push(panelId);
      }
      return { ...t, panelIds: ids };
    });
    setTabs(dashboardId, updated);
  };

  const handleUnassign = () => {
    const updated = tabs.map((t) => ({
      ...t,
      panelIds: t.panelIds.filter((id) => id !== panelId),
    }));
    setTabs(dashboardId, updated);
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        Tab
      </label>
      <select
        value={currentTab?.id ?? ""}
        onChange={(e) => {
          if (e.target.value) {
            handleAssign(e.target.value);
          } else {
            handleUnassign();
          }
        }}
        className="w-full rounded border border-border/40 bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">No tab (all views)</option>
        {tabs.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ── Drilldown Config ─────────────────────────────── */

function DrilldownConfig({
  panel,
  columns,
  onChange,
}: {
  panel: Panel;
  columns: string[];
  onChange: (updates: Partial<Panel>) => void;
}) {
  const [open, setOpen] = useState(false);
  const levels = panel.drilldownLevels ?? [];

  const addLevel = (col: string) => {
    if (!levels.includes(col)) {
      onChange({ drilldownLevels: [...levels, col] });
    }
  };

  const removeLevel = (index: number) => {
    const next = levels.filter((_, i) => i !== index);
    onChange({ drilldownLevels: next.length > 0 ? next : undefined });
  };

  return (
    <div>
      <button
        className="flex w-full items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        Drilldown
        {levels.length > 0 && (
          <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
            {levels.length} level{levels.length > 1 ? "s" : ""}
          </span>
        )}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {levels.length > 0 && (
            <div className="space-y-1">
              {levels.map((col, i) => (
                <div
                  key={`${col}-${i}`}
                  className="flex items-center gap-2 rounded border border-border/40 px-2 py-1 text-xs"
                >
                  <span className="text-[10px] text-muted-foreground w-3">
                    {i + 1}.
                  </span>
                  <span className="flex-1 font-mono text-[11px]">{col}</span>
                  <button
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => removeLevel(i)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add column dropdown */}
          {columns.filter((c) => !levels.includes(c)).length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) addLevel(e.target.value);
              }}
              className="w-full rounded border border-border/40 bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Add drilldown level…</option>
              {columns
                .filter((c) => !levels.includes(c))
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          )}

          {/* Show data drawer toggle */}
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={panel.showDataDrawer ?? false}
              onChange={(e) => onChange({ showDataDrawer: e.target.checked })}
              className="rounded"
            />
            Show data drawer to consumers
          </label>

          {/* Show query toggle */}
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={panel.showQueryToConsumer ?? false}
              onChange={(e) =>
                onChange({ showQueryToConsumer: e.target.checked })
              }
              className="rounded"
            />
            Show SQL query to consumers
          </label>
        </div>
      )}
    </div>
  );
}

/* ── Annotation Editor ─────────────────────────────── */

function AnnotationEditor({
  annotations,
  onChange,
}: {
  annotations: PanelAnnotation[];
  onChange: (annotations: PanelAnnotation[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftX, setDraftX] = useState("");
  const [draftY, setDraftY] = useState("");

  const add = () => {
    const text = draftText.trim();
    if (!text) return;
    const ann: PanelAnnotation = {
      id: createId(),
      text,
      x: draftX ? (isNaN(Number(draftX)) ? draftX : Number(draftX)) : undefined,
      y: draftY ? Number(draftY) : undefined,
      createdAt: new Date().toISOString(),
    };
    onChange([...annotations, ann]);
    setDraftText("");
    setDraftX("");
    setDraftY("");
  };

  const remove = (id: string) => {
    onChange(annotations.filter((a) => a.id !== id));
  };

  return (
    <div>
      <button
        className="flex w-full items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        Annotations
        {annotations.length > 0 && (
          <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
            {annotations.length}
          </span>
        )}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {annotations.map((ann) => (
            <div
              key={ann.id}
              className="flex items-start gap-2 rounded border border-border/40 px-2 py-1.5 text-xs"
            >
              <div className="flex-1">
                <p className="font-medium">{ann.text}</p>
                <p className="text-[10px] text-muted-foreground">
                  {ann.x !== undefined ? `x: ${ann.x}` : ""}
                  {ann.x !== undefined && ann.y !== undefined ? ", " : ""}
                  {ann.y !== undefined ? `y: ${ann.y}` : ""}
                </p>
              </div>
              <button
                className="text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                onClick={() => remove(ann.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Add annotation form */}
          <div className="space-y-1.5">
            <input
              className="w-full rounded border border-border/40 bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
              placeholder="Annotation text…"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
              }}
            />
            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded border border-border/40 bg-background px-2 py-1 text-[10px] outline-none focus:ring-1 focus:ring-ring"
                placeholder="X value (optional)"
                value={draftX}
                onChange={(e) => setDraftX(e.target.value)}
              />
              <input
                className="flex-1 rounded border border-border/40 bg-background px-2 py-1 text-[10px] outline-none focus:ring-1 focus:ring-ring"
                placeholder="Y value (optional)"
                value={draftY}
                onChange={(e) => setDraftY(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-6 gap-1 px-2 text-[10px]"
                onClick={add}
                disabled={!draftText.trim()}
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Custom Viz Editor ──────────────────────────── */

const CUSTOM_VIZ_PLACEHOLDER = `// Write SQL in the SQL tab above → results arrive as ctx.data
// ctx: { container, data, columns, d3, width, height }
const { container, data, d3, width, height } = ctx;

// Example: horizontal bar chart
// SQL: SELECT category, SUM(value) AS total FROM my_table GROUP BY category ORDER BY total DESC
const margin = { top: 10, right: 20, bottom: 30, left: 100 };
const w = width - margin.left - margin.right;
const h = height - margin.top - margin.bottom;

const svg = d3.select(container).append("svg")
  .attr("width", width).attr("height", height)
  .append("g").attr("transform", \`translate(\${margin.left},\${margin.top})\`);

const x = d3.scaleLinear()
  .domain([0, d3.max(data, d => +d.total) || 1]).range([0, w]);
const y = d3.scaleBand()
  .domain(data.map(d => String(d.category))).range([0, h]).padding(0.25);

svg.append("g").call(d3.axisLeft(y));
svg.append("g").attr("transform", \`translate(0,\${h})\`).call(d3.axisBottom(x).ticks(5));

svg.selectAll("rect").data(data).join("rect")
  .attr("x", 0).attr("y", d => y(String(d.category)))
  .attr("width", d => x(+d.total)).attr("height", y.bandwidth())
  .attr("fill", d3.schemeTableau10[0]);`;

function CustomVizEditor({
  dashboardId,
  panel,
}: {
  dashboardId: string;
  panel: Panel;
}) {
  const updatePanel = useDashboardStore((s) => s.updatePanel);
  const [showDocs, setShowDocs] = useState(false);

  return (
    <div className="border-b border-border/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">
          Custom D3 Visualization
        </label>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowDocs(!showDocs)}
          title="Show context reference"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </div>

      {showDocs && (
        <div className="rounded-md border border-border/40 bg-muted/30 p-2.5 text-[10px] font-mono text-muted-foreground space-y-0.5">
          <p className="font-semibold text-foreground mb-1">ctx object:</p>
          <p><span className="text-primary">container</span> — HTMLDivElement mount point</p>
          <p><span className="text-primary">data</span> — Row[] from your SQL query (empty if no SQL)</p>
          <p><span className="text-primary">columns</span> — {"{ name, type }[]"} metadata</p>
          <p><span className="text-primary">d3</span> — Full D3 library (v7)</p>
          <p><span className="text-primary">width</span> / <span className="text-primary">height</span> — container dimensions</p>
          <p className="mt-1 text-[9px] opacity-60">Write SQL in the SQL tab above to populate ctx.data. Code re-runs on result change and resize.</p>
        </div>
      )}

      <div className="h-64 overflow-hidden rounded border border-border/40">
        <JsEditor
          value={panel.customVizCode ?? ""}
          onChange={(code) => updatePanel(dashboardId, panel.id, { customVizCode: code })}
          placeholder={CUSTOM_VIZ_PLACEHOLDER}
        />
      </div>
    </div>
  );
}

/* ── Full Width Toggle ──────────────────────────── */

function FullWidthToggle({ dashboardId, panelId }: { dashboardId: string; panelId: string }) {
  const panel = useDashboardStore((s) => s.dashboards[dashboardId]?.panels.find((p) => p.id === panelId));
  const updatePanel = useDashboardStore((s) => s.updatePanel);

  return (
    <label className="flex items-center gap-2 text-xs">
      <input
        type="checkbox"
        checked={!!panel?.fullWidth}
        onChange={(e) => updatePanel(dashboardId, panelId, { fullWidth: e.target.checked || undefined })}
        className="rounded"
      />
      Full width
    </label>
  );
}
