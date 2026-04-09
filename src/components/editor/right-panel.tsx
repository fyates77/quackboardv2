import { useCallback, useState } from "react";
import { ChevronRight, Play, AlertCircle } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useEngine } from "@/engine/use-engine";
import type { Panel } from "@/types/dashboard";
import type { QueryResult } from "@/engine/types";
import type { RightTab } from "./editor-shell";

interface RightPanelProps {
  dashboardId: string;
  selectedPanel: Panel | null;
  activeTab: RightTab;
  onTabChange: (tab: RightTab) => void;
  queryResults: Map<string, QueryResult>;
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
          {["bar", "line", "area", "scatter", "pie", "table", "kpi", "markdown", "image"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
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

function DataTab({
  dashboardId,
  panel,
  queryResult,
}: {
  dashboardId: string;
  panel: Panel;
  queryResult: QueryResult | null;
}) {
  const updatePanelQuery = useDashboardStore((s) => s.updatePanelQuery);
  const updatePanelVisualization = useDashboardStore((s) => s.updatePanelVisualization);
  const engine = useEngine();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localResult, setLocalResult] = useState<QueryResult | null>(null);

  const result = localResult ?? queryResult;

  const handleRun = useCallback(async () => {
    if (!panel.query.sql.trim()) return;
    setRunning(true);
    setError(null);
    try {
      const r = await engine.executeQuery(panel.query.sql);
      setLocalResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }, [panel.query.sql, engine]);

  const CHANNELS = ["x", "y", "color", "size", "label"];

  return (
    <>
      {/* Data binding */}
      <Section title="Data Binding">
        <div
          style={{
            background: "var(--color-background-secondary)",
            borderRadius: "var(--border-radius-md)",
            border: "0.5px solid var(--color-border-tertiary)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            lineHeight: 1.7,
            padding: "8px 10px",
            marginBottom: 6,
          }}
        >
          <textarea
            value={panel.query.sql}
            onChange={(e) => updatePanelQuery(dashboardId, panel.id, e.target.value)}
            style={{
              width: "100%",
              minHeight: 80,
              border: "none",
              background: "transparent",
              fontFamily: "inherit",
              fontSize: "inherit",
              lineHeight: "inherit",
              color: "var(--color-text-primary)",
              resize: "vertical",
              outline: "none",
            }}
            placeholder="SELECT * FROM my_table"
            spellCheck={false}
          />
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              gap: 6,
              padding: "5px 7px",
              background: "hsl(0 72% 55% / 0.1)",
              border: "0.5px solid hsl(0 72% 55% / 0.3)",
              borderRadius: "var(--border-radius-sm)",
              marginBottom: 6,
            }}
          >
            <AlertCircle size={11} style={{ color: "hsl(0 72% 55%)", flexShrink: 0, marginTop: 1 }} />
            <pre style={{ fontSize: 9, color: "hsl(0 72% 55%)", whiteSpace: "pre-wrap", margin: 0, fontFamily: "var(--font-mono)" }}>
              {error}
            </pre>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={handleRun}
            disabled={running || !panel.query.sql.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 500,
              border: "none",
              borderRadius: "var(--border-radius-sm)",
              background: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
              cursor: running ? "not-allowed" : "pointer",
              opacity: running ? 0.6 : 1,
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
      </Section>

      {/* Column mapping */}
      <Section title="Column Mapping">
        {CHANNELS.map((ch) => {
          const bound = panel.visualization?.mapping?.[ch as keyof typeof panel.visualization.mapping];
          return (
            <div
              key={ch}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 5,
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 56,
                  fontSize: 11,
                  color: "var(--color-muted-foreground)",
                  flexShrink: 0,
                  textTransform: "capitalize",
                }}
              >
                {ch}
              </span>
              {bound ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "3px 7px",
                    background: "var(--color-background-warning)",
                    color: "var(--color-text-warning)",
                    border: "0.5px solid var(--color-border-warning)",
                    borderRadius: 4,
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    updatePanelVisualization(dashboardId, panel.id, {
                      mapping: { ...panel.visualization.mapping, [ch]: undefined },
                    })
                  }
                >
                  ↗ {bound}
                </span>
              ) : (
                <span style={{ fontSize: 10, color: "var(--color-muted-foreground)", opacity: 0.5 }}>
                  none
                </span>
              )}
            </div>
          );
        })}
        {result && result.columns.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <FieldLabel>Available columns</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 2 }}>
              {result.columns.map((c) => (
                <span
                  key={c.name}
                  style={{
                    fontSize: 9,
                    padding: "1px 5px",
                    borderRadius: 3,
                    background: "var(--color-background-secondary)",
                    color: "var(--color-muted-foreground)",
                    fontFamily: "var(--font-mono)",
                    cursor: "pointer",
                  }}
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>
    </>
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
