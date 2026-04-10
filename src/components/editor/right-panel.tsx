import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Play, AlertCircle, Plus, X, Code, Sliders, Maximize2 } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useEngine } from "@/engine/use-engine";
import { buildSQL } from "@/lib/query-builder";
import { queryCache } from "@/lib/query-cache";
import { createId } from "@/lib/id";
import { SqlEditor } from "@/components/query/sql-editor";
import type { Panel } from "@/types/dashboard";
import type { QueryResult } from "@/engine/types";
import type { BuilderConfig, AggFn, FilterOp } from "@/types/builder";
import { AGG_LABELS, FILTER_OPS } from "@/types/builder";
import type { RightTab } from "./editor-shell";

interface RightPanelProps {
  dashboardId: string;
  selectedPanel: Panel | null;
  activeTab: RightTab;
  onTabChange: (tab: RightTab) => void;
  queryResults: Map<string, QueryResult>;
  onQueryResult: (panelId: string, result: QueryResult) => void;
}

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "8px 12px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <ChevronRight
          size={10}
          style={{
            color: "var(--color-muted-foreground)",
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform 0.15s",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {title}
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 12px 10px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Field helpers ──────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, color: "var(--color-muted-foreground)", marginBottom: 3 }}>
      {children}
    </div>
  );
}

function SmallInput({
  value,
  onChange,
  type = "text",
  readOnly,
}: {
  value: string | number;
  onChange?: (v: string) => void;
  type?: "text" | "number";
  readOnly?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        width: "100%",
        fontSize: 11,
        padding: "3px 6px",
        border: "0.5px solid var(--color-border-secondary)",
        borderRadius: "var(--border-radius-sm)",
        background: readOnly ? "var(--color-background-secondary)" : "var(--color-background-primary)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-sans)",
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

// ── Design tab ─────────────────────────────────────────────────────────────

function DesignTab({
  dashboardId,
  panel,
}: {
  dashboardId: string;
  panel: Panel;
}) {
  const updatePanel = useDashboardStore((s) => s.updatePanel);
  const updateCanvasPosition = useDashboardStore((s) => s.updateCanvasPosition);
  const dashboard = useDashboardStore((s) => s.dashboards[dashboardId]);
  const pos = dashboard?.canvasPositions?.[panel.id];

  const handleNameChange = useCallback(
    (title: string) => updatePanel(dashboardId, panel.id, { title }),
    [dashboardId, panel.id, updatePanel],
  );

  const handlePosChange = useCallback(
    (field: "x" | "y" | "w" | "h", raw: string) => {
      const n = parseInt(raw, 10);
      if (isNaN(n)) return;
      if (!pos) return;
      updateCanvasPosition(dashboardId, panel.id, { ...pos, [field]: Math.max(0, n) });
    },
    [dashboardId, panel.id, pos, updateCanvasPosition],
  );

  const ALIGN_OPTIONS = ["Page", "Section", "Selection"];

  return (
    <>
      {/* Element */}
      <Section title="Element">
        <FieldLabel>Type</FieldLabel>
        <SmallInput value={panel.visualization?.type ?? "—"} readOnly />
        <div style={{ marginTop: 6 }} />
        <FieldLabel>Name</FieldLabel>
        <SmallInput value={panel.title} onChange={handleNameChange} />
      </Section>

      {/* Position & size */}
      <Section title="Position & Size">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {(["x", "y", "w", "h"] as const).map((field) => (
            <div key={field}>
              <FieldLabel>{field.toUpperCase()}</FieldLabel>
              <SmallInput
                type="number"
                value={pos?.[field] ?? ""}
                onChange={(v) => handlePosChange(field, v)}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
          {ALIGN_OPTIONS.map((opt) => (
            <button
              key={opt}
              style={{
                flex: 1,
                fontSize: 10,
                padding: "3px 4px",
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: "var(--border-radius-sm)",
                background: "transparent",
                color: "var(--color-muted-foreground)",
                cursor: "pointer",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <FieldLabel>Chart type</FieldLabel>
        <select
          value={panel.visualization?.type ?? "table"}
          onChange={(e) =>
            updatePanel(dashboardId, panel.id, {
              visualization: { ...panel.visualization, type: e.target.value as Panel["visualization"]["type"] },
            })
          }
          style={{
            width: "100%",
            fontSize: 11,
            padding: "3px 6px",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "var(--border-radius-sm)",
            background: "var(--color-background-primary)",
            color: "var(--color-text-primary)",
            cursor: "pointer",
          }}
        >
          <optgroup label="Charts">
            {["bar", "line", "area", "scatter", "histogram", "box", "heatmap", "waffle", "combo"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </optgroup>
          <optgroup label="Specialized">
            {["pie", "funnel", "treemap", "tree", "density", "difference", "flow", "network"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </optgroup>
          <optgroup label="Tables">
            {["table", "grouped-table", "crosstab"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </optgroup>
          <optgroup label="Content">
            {["kpi", "markdown", "html", "image", "embed", "custom", "nav-bar"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </optgroup>
        </select>

        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ flex: 1 }}>
            <FieldLabel>Fill</FieldLabel>
            <div style={{ display: "flex", gap: 4 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  border: "0.5px solid var(--color-border-secondary)",
                  background: panel.style?.background ?? "var(--color-background-primary)",
                  flexShrink: 0,
                }}
              />
              <SmallInput value={panel.style?.background ?? "#ffffff"} readOnly />
            </div>
          </div>
        </div>
      </Section>

      {/* Conditional visibility */}
      {panel.visibilityCondition && (
        <Section title="Conditional Visibility" defaultOpen={false}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 6,
              padding: "6px 8px",
              background: "var(--color-background-warning)",
              border: "0.5px solid var(--color-border-warning)",
              borderRadius: "var(--border-radius-sm)",
            }}
          >
            <AlertCircle size={11} style={{ color: "var(--color-text-warning)", marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "var(--color-text-warning)", fontFamily: "var(--font-mono)" }}>
              {panel.visibilityCondition.type}
              {panel.visibilityCondition.filterName && `: ${panel.visibilityCondition.filterName}`}
            </span>
          </div>
        </Section>
      )}
    </>
  );
}

// ── Data tab ───────────────────────────────────────────────────────────────

const EMPTY_BUILDER: BuilderConfig = { table: "", dimensions: [], measures: [], filters: [], limit: 1000 };

function DataTab({
  dashboardId,
  panel,
  queryResult,
  onQueryResult,
}: {
  dashboardId: string;
  panel: Panel;
  queryResult: QueryResult | null;
  onQueryResult: (panelId: string, result: QueryResult) => void;
}) {
  const updatePanelQuery = useDashboardStore((s) => s.updatePanelQuery);
  const updatePanelVisualization = useDashboardStore((s) => s.updatePanelVisualization);
  const updatePanelBuilderConfig = useDashboardStore((s) => s.updatePanelBuilderConfig);
  const setPanelQueryMode = useDashboardStore((s) => s.setPanelQueryMode);
  const engine = useEngine();

  const mode = panel.query.mode ?? (panel.query.builderConfig ? "builder" : "sql");
  const cfg: BuilderConfig = panel.query.builderConfig ?? EMPTY_BUILDER;

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localResult, setLocalResult] = useState<QueryResult | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [tableCols, setTableCols] = useState<string[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [expandOpen, setExpandOpen] = useState(false);

  const result = localResult ?? queryResult;
  const generatedSql = mode === "builder" ? buildSQL(cfg) : panel.query.sql;

  // Load available tables when entering builder mode
  useEffect(() => {
    if (mode !== "builder") return;
    engine.executeQuery(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' ORDER BY table_name"
    ).then((r) => setTables(r.rows.map((row) => row.table_name as string))).catch(() => {});
  }, [mode, engine]);

  // Load columns when table changes
  useEffect(() => {
    if (mode !== "builder" || !cfg.table) { setTableCols([]); return; }
    engine.executeQuery(`DESCRIBE "${cfg.table.replace(/"/g, '""')}"`)
      .then((r) => setTableCols(r.rows.map((row) => (row.column_name ?? row.Field ?? "") as string)))
      .catch(() => setTableCols([]));
  }, [mode, cfg.table, engine]);

  function updateBuilder(patch: Partial<BuilderConfig>) {
    const next = { ...cfg, ...patch };
    updatePanelBuilderConfig(dashboardId, panel.id, next, buildSQL(next));
  }

  const handleRun = useCallback(async () => {
    const sql = mode === "builder" ? generatedSql : panel.query.sql;
    if (!sql.trim()) return;
    setRunning(true); setError(null);
    try {
      const r = await engine.executeQuery(sql);
      setLocalResult(r);
      onQueryResult(panel.id, r);
      queryCache.set(sql, r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setRunning(false); }
  }, [generatedSql, panel.query.sql, panel.id, mode, engine, onQueryResult]);

  const CHANNELS = ["x", "y", "color", "size", "label"];

  // ── Shared run row ──────────────────────────────────────────────────────
  function RunRow() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={handleRun}
          disabled={running || !generatedSql.trim()}
          style={{
            display: "flex", alignItems: "center", gap: 4, padding: "3px 10px",
            fontSize: 11, fontWeight: 500, border: "none",
            borderRadius: "var(--border-radius-sm)",
            background: "var(--color-primary)", color: "var(--color-primary-foreground)",
            cursor: running ? "not-allowed" : "pointer", opacity: running ? 0.6 : 1,
          }}
        >
          <Play size={10} />
          {running ? "Running…" : "Run"}
        </button>
        {result && (
          <span style={{ fontSize: 9, color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>
            {result.elapsed.toFixed(1)}ms · {result.rowCount.toLocaleString()} rows
          </span>
        )}
      </div>
    );
  }

  // ── Mode toggle ─────────────────────────────────────────────────────────
  function ModeToggle() {
    return (
      <div style={{ display: "flex", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-sm)", overflow: "hidden", alignSelf: "flex-start" }}>
        {(["builder", "sql"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              if (m === mode) return;
              if (m === "sql") { setPanelQueryMode(dashboardId, panel.id, "sql"); }
              else { setShowResetConfirm(true); }
            }}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 10px", border: "none", fontSize: 10, fontWeight: 500,
              background: mode === m ? "var(--color-background-secondary)" : "transparent",
              color: mode === m ? "var(--color-text-primary)" : "var(--color-muted-foreground)",
              cursor: "pointer",
            }}
          >
            {m === "builder" ? <Sliders size={10} /> : <Code size={10} />}
            {m === "builder" ? "Builder" : "SQL"}
          </button>
        ))}
      </div>
    );
  }

  // ── Reset confirm ───────────────────────────────────────────────────────
  if (showResetConfirm) {
    return (
      <Section title="Switch to Builder">
        <p style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginBottom: 8, lineHeight: 1.5 }}>
          This will reset the builder fields. Your current SQL will be cleared.
        </p>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => {
              updatePanelBuilderConfig(dashboardId, panel.id, EMPTY_BUILDER, "");
              setPanelQueryMode(dashboardId, panel.id, "builder");
              setShowResetConfirm(false);
            }}
            style={{ fontSize: 11, padding: "3px 10px", border: "none", borderRadius: "var(--border-radius-sm)", background: "var(--color-destructive)", color: "var(--color-destructive-foreground)", cursor: "pointer" }}
          >
            Reset & switch
          </button>
          <button
            onClick={() => setShowResetConfirm(false)}
            style={{ fontSize: 11, padding: "3px 10px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-sm)", background: "transparent", color: "var(--color-muted-foreground)", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </Section>
    );
  }

  return (
    <>
      {/* Mode toggle */}
      <Section title="Data Source">
        <ModeToggle />
      </Section>

      {/* ── Builder mode ── */}
      {mode === "builder" && (
        <>
          <Section title="Table">
            <select
              value={cfg.table}
              onChange={(e) => updateBuilder({ table: e.target.value, dimensions: [], measures: [], filters: [], orderByColumn: undefined })}
              style={selectStyle}
            >
              <option value="">— select table —</option>
              {tables.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Section>

          <Section title="Dimensions">
            {cfg.dimensions.map((dim) => (
              <div key={dim.id} style={{ display: "flex", gap: 4, marginBottom: 4, alignItems: "center" }}>
                <select value={dim.column} onChange={(e) => updateBuilder({ dimensions: cfg.dimensions.map((d) => d.id === dim.id ? { ...d, column: e.target.value } : d) })} style={{ ...selectStyle, flex: 1 }}>
                  <option value="">— column —</option>
                  {tableCols.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={() => updateBuilder({ dimensions: cfg.dimensions.filter((d) => d.id !== dim.id) })} style={removeBtn}><X size={10} /></button>
              </div>
            ))}
            <button onClick={() => updateBuilder({ dimensions: [...cfg.dimensions, { id: createId(), column: "" }] })} style={addBtn}><Plus size={10} /> Add dimension</button>
          </Section>

          <Section title="Measures">
            {cfg.measures.map((m) => (
              <div key={m.id} style={{ display: "flex", gap: 4, marginBottom: 4, alignItems: "center" }}>
                <select value={m.column} onChange={(e) => updateBuilder({ measures: cfg.measures.map((ms) => ms.id === m.id ? { ...ms, column: e.target.value } : ms) })} style={{ ...selectStyle, flex: 1 }}>
                  <option value="">— column —</option>
                  {m.aggFn === "count" && <option value="*">* (all rows)</option>}
                  {tableCols.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={m.aggFn} onChange={(e) => updateBuilder({ measures: cfg.measures.map((ms) => ms.id === m.id ? { ...ms, aggFn: e.target.value as AggFn } : ms) })} style={{ ...selectStyle, width: 88, flexShrink: 0 }}>
                  {(Object.entries(AGG_LABELS) as [AggFn, string][]).map(([fn, label]) => (
                    <option key={fn} value={fn}>{label}</option>
                  ))}
                </select>
                <button onClick={() => updateBuilder({ measures: cfg.measures.filter((ms) => ms.id !== m.id) })} style={removeBtn}><X size={10} /></button>
              </div>
            ))}
            <button onClick={() => updateBuilder({ measures: [...cfg.measures, { id: createId(), column: "", aggFn: "sum" }] })} style={addBtn}><Plus size={10} /> Add measure</button>
          </Section>

          <Section title="Filters" defaultOpen={false}>
            {cfg.filters.map((f) => (
              <div key={f.id} style={{ display: "flex", gap: 3, marginBottom: 4, alignItems: "center", flexWrap: "wrap" }}>
                <select value={f.column} onChange={(e) => updateBuilder({ filters: cfg.filters.map((fl) => fl.id === f.id ? { ...fl, column: e.target.value } : fl) })} style={{ ...selectStyle, flex: "1 1 80px", minWidth: 0 }}>
                  <option value="">— col —</option>
                  {tableCols.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={f.op} onChange={(e) => updateBuilder({ filters: cfg.filters.map((fl) => fl.id === f.id ? { ...fl, op: e.target.value as FilterOp } : fl) })} style={{ ...selectStyle, width: 72, flexShrink: 0 }}>
                  {FILTER_OPS.map((op) => <option key={op} value={op}>{op}</option>)}
                </select>
                {f.op !== "IS NULL" && f.op !== "IS NOT NULL" && (
                  <input
                    value={f.value ?? ""}
                    onChange={(e) => updateBuilder({ filters: cfg.filters.map((fl) => fl.id === f.id ? { ...fl, value: e.target.value } : fl) })}
                    placeholder="value"
                    style={{ ...selectStyle, flex: "1 1 60px", minWidth: 0 }}
                  />
                )}
                <button onClick={() => updateBuilder({ filters: cfg.filters.filter((fl) => fl.id !== f.id) })} style={removeBtn}><X size={10} /></button>
              </div>
            ))}
            <button onClick={() => updateBuilder({ filters: [...cfg.filters, { id: createId(), column: "", op: "=", value: "" }] })} style={addBtn}><Plus size={10} /> Add filter</button>
          </Section>

          <Section title="Options" defaultOpen={false}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <FieldLabel>Limit</FieldLabel>
                <input
                  type="number"
                  value={cfg.limit ?? ""}
                  onChange={(e) => updateBuilder({ limit: e.target.value ? Number(e.target.value) : undefined })}
                  style={selectStyle}
                  placeholder="1000"
                  min={1}
                />
              </div>
              <div style={{ flex: 1 }}>
                <FieldLabel>Order by</FieldLabel>
                <select value={cfg.orderByColumn ?? ""} onChange={(e) => updateBuilder({ orderByColumn: e.target.value || undefined })} style={selectStyle}>
                  <option value="">— none —</option>
                  {tableCols.map((c) => <option key={c} value={c}>{c}</option>)}
                  {cfg.measures.map((m) => {
                    const alias = m.alias || (m.aggFn === "count" ? "count" : `${m.aggFn}_${m.column}`);
                    return <option key={alias} value={alias}>{alias}</option>;
                  })}
                </select>
              </div>
              <div>
                <FieldLabel>Dir</FieldLabel>
                <select value={cfg.orderByDir ?? "DESC"} onChange={(e) => updateBuilder({ orderByDir: e.target.value as "ASC" | "DESC" })} style={{ ...selectStyle, width: 60 }}>
                  <option value="DESC">DESC</option>
                  <option value="ASC">ASC</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Generated SQL preview (read-only) */}
          <Section title="Generated SQL">
            <pre style={{
              margin: 0, fontSize: 9, fontFamily: "var(--font-mono)", lineHeight: 1.6,
              color: "var(--color-muted-foreground)", whiteSpace: "pre-wrap", wordBreak: "break-all",
              background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-sm)",
              border: "0.5px solid var(--color-border-tertiary)", padding: "6px 8px",
            }}>
              {generatedSql || "— configure a table above —"}
            </pre>
            {error && <ErrorBanner message={error} />}
            <div style={{ marginTop: 6 }}>
              <RunRow />
            </div>
          </Section>
        </>
      )}

      {/* ── SQL mode ── */}
      {mode === "sql" && (
        <Section title="SQL">
          {/* Editor */}
          <div style={{ height: 140, marginBottom: 6, borderRadius: "var(--border-radius-sm)", overflow: "hidden", border: "0.5px solid var(--color-border-secondary)" }}>
            <SqlEditor
              value={panel.query.sql}
              onChange={(v) => updatePanelQuery(dashboardId, panel.id, v)}
              onRun={handleRun}
            />
          </div>
          {/* Toolbar row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <RunRow />
            <button
              onClick={() => setExpandOpen(true)}
              title="Expand editor"
              style={{ ...removeBtn, width: 24, height: 24, border: "0.5px solid var(--color-border-secondary)", marginLeft: "auto" }}
            >
              <Maximize2 size={11} />
            </button>
          </div>
          {error && <ErrorBanner message={error} />}
          {/* Inline data preview */}
          {result && result.rows.length > 0 && (
            <DataPreview result={result} maxRows={6} />
          )}
        </Section>
      )}

      {/* Column mapping */}
      <Section title="Column Mapping">
        {CHANNELS.map((ch) => {
          const bound = panel.visualization?.mapping?.[ch as keyof typeof panel.visualization.mapping];
          const cols = result?.columns.map((c) => c.name) ?? [];
          return (
            <div key={ch} style={{ display: "flex", alignItems: "center", marginBottom: 5, gap: 6 }}>
              <span style={{ width: 40, fontSize: 10, color: "var(--color-muted-foreground)", flexShrink: 0, textTransform: "capitalize" }}>
                {ch}
              </span>
              <select
                value={bound ?? ""}
                onChange={(e) => updatePanelVisualization(dashboardId, panel.id, {
                  mapping: { ...panel.visualization.mapping, [ch]: e.target.value || undefined },
                })}
                style={{ ...selectStyle, flex: 1, fontSize: 10 }}
              >
                <option value="">— none —</option>
                {cols.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          );
        })}
        {(!result || result.columns.length === 0) && (
          <p style={{ fontSize: 10, color: "var(--color-muted-foreground)", opacity: 0.6, marginTop: 2 }}>
            Run a query to see available columns
          </p>
        )}
      </Section>

      {/* ── Expand overlay ── */}
      {expandOpen && (
        <SqlExpandOverlay
          sql={panel.query.sql}
          result={result}
          running={running}
          error={error}
          onChange={(v) => updatePanelQuery(dashboardId, panel.id, v)}
          onRun={handleRun}
          onClose={() => setExpandOpen(false)}
        />
      )}
    </>
  );
}

// ── Shared micro-styles ────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  width: "100%", fontSize: 10, padding: "3px 6px",
  border: "0.5px solid var(--color-border-secondary)",
  borderRadius: "var(--border-radius-sm)",
  background: "var(--color-background-primary)",
  color: "var(--color-text-primary)", cursor: "pointer", outline: "none",
};

const addBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 4, fontSize: 10,
  padding: "2px 8px", border: "0.5px dashed var(--color-border-secondary)",
  borderRadius: "var(--border-radius-sm)", background: "transparent",
  color: "var(--color-muted-foreground)", cursor: "pointer", width: "100%", justifyContent: "center",
};

const removeBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 20, height: 20, flexShrink: 0, border: "none",
  background: "transparent", color: "var(--color-muted-foreground)", cursor: "pointer",
  borderRadius: "var(--border-radius-sm)", padding: 0,
};

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ display: "flex", gap: 6, padding: "5px 7px", background: "hsl(0 72% 55% / 0.1)", border: "0.5px solid hsl(0 72% 55% / 0.3)", borderRadius: "var(--border-radius-sm)", marginBottom: 6 }}>
      <AlertCircle size={11} style={{ color: "hsl(0 72% 55%)", flexShrink: 0, marginTop: 1 }} />
      <pre style={{ fontSize: 9, color: "hsl(0 72% 55%)", whiteSpace: "pre-wrap", margin: 0, fontFamily: "var(--font-mono)" }}>{message}</pre>
    </div>
  );
}

function DataPreview({ result, maxRows = 6 }: { result: QueryResult; maxRows?: number }) {
  const cols = result.columns.slice(0, 6);
  const rows = result.rows.slice(0, maxRows);
  return (
    <div style={{ marginTop: 6, overflowX: "auto", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-sm)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9, fontFamily: "var(--font-mono)" }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.name} style={{ padding: "3px 6px", textAlign: "left", fontWeight: 600, color: "var(--color-muted-foreground)", background: "var(--color-background-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)", whiteSpace: "nowrap" }}>
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 1 ? "var(--color-background-secondary)" : "transparent" }}>
              {cols.map((c) => (
                <td key={c.name} style={{ padding: "2px 6px", color: "var(--color-text-primary)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {String(row[c.name] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: "2px 6px", fontSize: 9, color: "var(--color-muted-foreground)", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
        {result.rowCount.toLocaleString()} rows · {result.elapsed.toFixed(1)}ms
        {result.columns.length > 6 && ` · ${result.columns.length - 6} more columns hidden`}
      </div>
    </div>
  );
}

function SqlExpandOverlay({
  sql,
  result,
  running,
  error,
  onChange,
  onRun,
  onClose,
}: {
  sql: string;
  result: QueryResult | null;
  running: boolean;
  error: string | null;
  onChange: (v: string) => void;
  onRun: () => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "hsla(0,0%,0%,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 40,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%", maxWidth: 900, height: "80vh",
          background: "var(--color-background-primary)",
          borderRadius: "var(--border-radius-lg)",
          border: "0.5px solid var(--color-border-secondary)",
          boxShadow: "0 24px 64px hsla(220,30%,10%,0.4)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderBottom: "0.5px solid var(--color-border-tertiary)", flexShrink: 0, gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)", flex: 1 }}>SQL Editor</span>
          <button
            onClick={onRun}
            disabled={running || !sql.trim()}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 12px", fontSize: 11, fontWeight: 500, border: "none", borderRadius: "var(--border-radius-sm)", background: "var(--color-primary)", color: "var(--color-primary-foreground)", cursor: running ? "not-allowed" : "pointer", opacity: running ? 0.6 : 1 }}
          >
            <Play size={11} />
            {running ? "Running…" : "Run  ⌘↵"}
          </button>
          <button onClick={onClose} style={{ ...removeBtn, width: 28, height: 28, border: "0.5px solid var(--color-border-secondary)" }}>
            <X size={13} />
          </button>
        </div>

        {/* Editor — top half */}
        <div style={{ flex: "0 0 45%", overflow: "hidden", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <SqlEditor value={sql} onChange={onChange} onRun={onRun} />
        </div>

        {/* Results — bottom half */}
        <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
          {error && <ErrorBanner message={error} />}
          {result ? (
            <>
              <div style={{ fontSize: 10, color: "var(--color-muted-foreground)", marginBottom: 6, fontFamily: "var(--font-mono)" }}>
                {result.rowCount.toLocaleString()} rows · {result.elapsed.toFixed(1)}ms
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", fontSize: 11, fontFamily: "var(--font-mono)", width: "100%" }}>
                  <thead>
                    <tr>
                      {result.columns.map((c) => (
                        <th key={c.name} style={{ padding: "4px 10px", textAlign: "left", fontWeight: 600, color: "var(--color-muted-foreground)", background: "var(--color-background-secondary)", borderBottom: "0.5px solid var(--color-border-secondary)", whiteSpace: "nowrap" }}>
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.slice(0, 200).map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)", background: ri % 2 === 1 ? "var(--color-background-secondary)" : "transparent" }}>
                        {result.columns.map((c) => (
                          <td key={c.name} style={{ padding: "3px 10px", color: "var(--color-text-primary)", whiteSpace: "nowrap", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {String(row[c.name] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.rows.length > 200 && (
                  <p style={{ fontSize: 10, color: "var(--color-muted-foreground)", padding: "6px 10px" }}>
                    Showing 200 of {result.rowCount.toLocaleString()} rows
                  </p>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 11, color: "var(--color-muted-foreground)" }}>
              Run a query to see results
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Interact tab ───────────────────────────────────────────────────────────

function InteractTab({ panel }: { panel: Panel }) {
  const PLACEHOLDER_SECTIONS = [
    {
      title: "Drilldown",
      body: panel.drilldownLevels?.length
        ? `${panel.drilldownLevels.length} level(s): ${panel.drilldownLevels.join(" › ")}`
        : null,
      action: "Add drilldown",
    },
    {
      title: "Parameters",
      body: null,
      action: "Add parameter",
    },
    {
      title: "Filters",
      body: null,
      action: "Add filter",
    },
  ];

  return (
    <>
      {PLACEHOLDER_SECTIONS.map(({ title, body, action }) => (
        <Section key={title} title={title} defaultOpen={false}>
          {body && (
            <p style={{ fontSize: 10, color: "var(--color-muted-foreground)", marginBottom: 6, fontFamily: "var(--font-mono)" }}>
              {body}
            </p>
          )}
          <button
            style={{
              fontSize: 11,
              padding: "4px 10px",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-sm)",
              background: "transparent",
              color: "var(--color-muted-foreground)",
              cursor: "pointer",
            }}
          >
            + {action}
          </button>
        </Section>
      ))}
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function RightPanel({
  dashboardId,
  selectedPanel,
  activeTab,
  onTabChange,
  queryResults,
  onQueryResult,
}: RightPanelProps) {
  const TABS: { id: RightTab; label: string }[] = [
    { id: "design", label: "Design" },
    { id: "data", label: "Data" },
    { id: "interact", label: "Interact" },
  ];

  return (
    <div
      style={{
        width: 280,
        height: "100%",
        background: "var(--color-background-primary)",
        borderLeft: "0.5px solid var(--color-border-tertiary)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Tab header */}
      <div
        style={{
          display: "flex",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
          flexShrink: 0,
        }}
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            style={{
              flex: 1,
              padding: "8px 4px 6px",
              border: "none",
              borderBottom: activeTab === id ? `2px solid var(--color-text-primary)` : "2px solid transparent",
              background: "transparent",
              color: activeTab === id ? "var(--color-text-primary)" : "var(--color-muted-foreground)",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 500,
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!selectedPanel ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              fontSize: 11,
              color: "var(--color-muted-foreground)",
              lineHeight: 1.6,
            }}
          >
            <p style={{ fontWeight: 500, marginBottom: 4 }}>Nothing selected</p>
            <p style={{ opacity: 0.7 }}>Click an element on the canvas to inspect its properties</p>
          </div>
        ) : (
          <>
            {activeTab === "design" && (
              <DesignTab dashboardId={dashboardId} panel={selectedPanel} />
            )}
            {activeTab === "data" && (
              <DataTab
                dashboardId={dashboardId}
                panel={selectedPanel}
                queryResult={queryResults.get(selectedPanel.id) ?? null}
                onQueryResult={onQueryResult}
              />
            )}
            {activeTab === "interact" && (
              <InteractTab panel={selectedPanel} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
