import { useCallback, useRef, useState } from "react";
import { Play, Plus, X, Download, AlertCircle, Clock, Rows3 } from "lucide-react";
import { useQuery } from "@/engine/use-query";
import { createId } from "@/lib/id";
import { exportResultsAsCsv, exportResultsAsJson } from "@/lib/export-results";
import { cn } from "@/lib/utils";
import { SqlEditor } from "@/components/query/sql-editor";
import { ResultsTable } from "@/components/query/results-table";
import { SchemaBrowser } from "@/components/data-sources/schema-browser";
import type { QueryResult } from "@/engine/types";

interface PlayTab {
  id: string;
  name: string;
  sql: string;
  result: QueryResult | null;
  error: string | null;
}

function makeTab(n: number): PlayTab {
  return { id: createId(), name: `Query ${n}`, sql: "", result: null, error: null };
}

export function PlayPondPage() {
  const { loading, execute, error: queryError } = useQuery();
  // Keep a ref to the current active tab id so the async callback always
  // writes results to the tab that triggered the query, even if the user
  // switched tabs while it was running.
  const runningTabRef = useRef<string | null>(null);

  const [tabs, setTabs] = useState<PlayTab[]>(() => [makeTab(1)]);
  const [activeId, setActiveId] = useState(() => tabs[0].id);
  const [tabCounter, setTabCounter] = useState(2);

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  // ── Tab management ───────────────────────────────────────────────────────

  const addTab = () => {
    const tab = makeTab(tabCounter);
    setTabCounter((n) => n + 1);
    setTabs((ts) => [...ts, tab]);
    setActiveId(tab.id);
  };

  const closeTab = (id: string) => {
    const remaining = tabs.filter((t) => t.id !== id);
    if (remaining.length === 0) {
      const tab = makeTab(tabCounter);
      setTabCounter((n) => n + 1);
      setTabs([tab]);
      setActiveId(tab.id);
    } else {
      setTabs(remaining);
      if (activeId === id) setActiveId(remaining[remaining.length - 1].id);
    }
  };

  const updateSql = useCallback(
    (sql: string) => {
      setTabs((ts) => ts.map((t) => (t.id === activeId ? { ...t, sql } : t)));
    },
    [activeId],
  );

  // ── Query execution ──────────────────────────────────────────────────────

  const handleRun = useCallback(async () => {
    const sql = active.sql.trim();
    if (!sql) return;

    const tabId = activeId;
    runningTabRef.current = tabId;

    // Clear previous result for this tab while running
    setTabs((ts) =>
      ts.map((t) => (t.id === tabId ? { ...t, result: null, error: null } : t)),
    );

    const result = await execute(sql);

    setTabs((ts) =>
      ts.map((t) => {
        if (t.id !== tabId) return t;
        if (result) return { ...t, result, error: null };
        // execute returned null — error is surfaced via queryError below
        return t;
      }),
    );
  }, [active.sql, activeId, execute]);

  // Merge live queryError into the active tab's display (only while that tab is running)
  const activeWithError: PlayTab = {
    ...active,
    error:
      active.error ??
      (queryError && runningTabRef.current === activeId ? queryError : null),
  };

  // ── Export ───────────────────────────────────────────────────────────────

  const exportCsv = () => {
    if (active.result) exportResultsAsCsv(active.result, active.name);
  };

  const exportJson = () => {
    if (active.result) exportResultsAsJson(active.result, active.name);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Page header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold">Play Pond 🦆</h1>
          <p className="text-muted-foreground text-sm">
            Scratchpad SQL against your tables, models, and macros
          </p>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Left: schema browser */}
        <div className="w-56 shrink-0 flex flex-col min-h-0 rounded-lg border border-border overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b bg-muted/40 shrink-0">
            Schema
          </div>
          <div className="flex-1 overflow-y-auto">
            <SchemaBrowser />
          </div>
        </div>

        {/* Right: editor + results */}
        <div className="flex flex-1 flex-col min-h-0 min-w-0 gap-0">
          {/* Tab bar */}
          <div className="flex items-center gap-0 border-b border-border shrink-0">
            <div className="flex items-center gap-0 flex-1 overflow-x-auto min-w-0">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  tab={tab}
                  active={tab.id === activeId}
                  onSelect={() => setActiveId(tab.id)}
                  onClose={tabs.length > 1 ? () => closeTab(tab.id) : undefined}
                  hasResult={!!tab.result}
                  hasError={!!tab.error}
                />
              ))}
            </div>
            <button
              onClick={addTab}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors mx-1"
              title="New query tab"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Editor area */}
          <div className="relative flex-1 min-h-0 border-x border-border">
            <SqlEditor
              value={active.sql}
              onChange={updateSql}
              onRun={handleRun}
            />
            {/* Run button overlay */}
            <button
              onClick={handleRun}
              disabled={loading || !active.sql.trim()}
              className={cn(
                "absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium shadow transition-all",
                loading
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:opacity-90",
              )}
            >
              <Play className="h-3 w-3" />
              {loading ? "Running…" : "Run"}
              <span className="opacity-60 text-[10px]">⌘↵</span>
            </button>
          </div>

          {/* Results panel */}
          <ResultsPanel
            tab={activeWithError}
            loading={loading}
            onExportCsv={exportCsv}
            onExportJson={exportJson}
          />
        </div>
      </div>
    </div>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────

function TabButton({
  tab,
  active,
  hasResult,
  hasError,
  onSelect,
  onClose,
}: {
  tab: PlayTab;
  active: boolean;
  hasResult: boolean;
  hasError: boolean;
  onSelect: () => void;
  onClose?: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1.5 px-3 h-9 border-r border-border cursor-pointer select-none shrink-0 transition-colors text-sm",
        active
          ? "bg-background text-foreground border-b-2 border-b-primary"
          : "bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground border-b-2 border-b-transparent",
      )}
      onClick={onSelect}
    >
      {hasError && <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />}
      {hasResult && !hasError && (
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
      )}
      <span className="max-w-[100px] truncate">{tab.name}</span>
      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity ml-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ── Results panel ─────────────────────────────────────────────────────────────

function ResultsPanel({
  tab,
  loading,
  onExportCsv,
  onExportJson,
}: {
  tab: PlayTab;
  loading: boolean;
  onExportCsv: () => void;
  onExportJson: () => void;
}) {
  return (
    <div className="h-72 flex flex-col border border-border rounded-b-lg overflow-hidden">
      {/* Results header bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border bg-muted/40 shrink-0">
        <span className="text-xs font-semibold text-muted-foreground">Results</span>

        {tab.result && (
          <>
            <span className="flex items-center gap-1.5 rounded bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums">
              <Rows3 className="h-3 w-3 text-muted-foreground" />
              {tab.result.rowCount.toLocaleString()} rows
            </span>
            <span className="flex items-center gap-1.5 rounded bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-green-600 dark:text-green-400">
              <Clock className="h-3 w-3" />
              {tab.result.elapsed.toFixed(1)}ms
            </span>
            <div className="flex-1" />
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Export CSV"
            >
              <Download className="h-3 w-3" />
              CSV
            </button>
            <button
              onClick={onExportJson}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Export JSON"
            >
              <Download className="h-3 w-3" />
              JSON
            </button>
          </>
        )}
      </div>

      {/* Results body */}
      <div className="flex-1 overflow-auto min-w-0">
        {loading && (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Running query…
          </div>
        )}

        {!loading && tab.error && (
          <div className="p-4">
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
              <pre className="text-xs text-destructive whitespace-pre-wrap break-all font-mono">
                {tab.error}
              </pre>
            </div>
          </div>
        )}

        {!loading && !tab.error && tab.result && (
          <ResultsTable result={tab.result} />
        )}

        {!loading && !tab.error && !tab.result && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground select-none">
            <span className="text-3xl">🦆</span>
            <p className="text-sm">Run a query to see results</p>
            <p className="text-xs opacity-60">
              Tables, models, joins, and macros are all fair game
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
