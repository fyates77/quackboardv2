import { useCallback, useEffect, useState } from "react";
import { Play, Loader2, X, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useUIStore } from "@/stores/ui-store";
import { useQuery } from "@/engine/use-query";
import { inferVisualization } from "@/lib/viz-defaults";
import { Button } from "@/components/ui/button";
import { SqlEditor } from "@/components/query/sql-editor";
import { ResultsTable } from "@/components/query/results-table";
import { VizConfigPanel } from "@/components/visualizations/viz-config-panel";
import type { QueryResult } from "@/engine/types";
import type {
  Panel,
  VisualizationType,
  ColumnMapping,
  VisualizationOptions,
} from "@/types/dashboard";

interface PanelEditorProps {
  dashboardId: string;
  panel: Panel;
  onQueryResult: (panelId: string, result: QueryResult | null) => void;
}

export function PanelEditor({
  dashboardId,
  panel,
  onQueryResult,
}: PanelEditorProps) {
  const updatePanelQuery = useDashboardStore((s) => s.updatePanelQuery);
  const updatePanelVisualization = useDashboardStore(
    (s) => s.updatePanelVisualization,
  );
  const setActivePanelId = useUIStore((s) => s.setActivePanelId);

  const [sqlDraft, setSqlDraft] = useState(panel.query.sql);
  const [resultsOpen, setResultsOpen] = useState(false);
  const { data, loading, error, execute } = useQuery();

  // Sync draft when switching panels
  useEffect(() => {
    setSqlDraft(panel.query.sql);
  }, [panel.id, panel.query.sql]);

  // Push results to parent whenever they change
  useEffect(() => {
    onQueryResult(panel.id, data);
  }, [panel.id, data, onQueryResult]);

  const handleRun = useCallback(async () => {
    const trimmed = sqlDraft.trim();
    if (!trimmed) return;

    // Persist SQL to store
    updatePanelQuery(dashboardId, panel.id, trimmed);

    const result = await execute(trimmed);

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

  return (
    <div className="flex h-full flex-col border-l bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
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

      <div className="flex-1 overflow-auto">
        {/* SQL Editor section */}
        <div className="border-b p-3">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              SQL Query
            </label>
            <Button
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleRun}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              Run
            </Button>
          </div>
          <div className="h-40">
            <SqlEditor
              value={sqlDraft}
              onChange={setSqlDraft}
              onRun={handleRun}
            />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Cmd+Enter to run
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 border-b p-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <pre className="whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {/* Viz config section */}
        <div className="border-b p-3">
          <VizConfigPanel
            config={panel.visualization}
            result={data}
            onChangeType={handleChangeType}
            onChangeMapping={handleChangeMapping}
            onChangeOptions={handleChangeOptions}
          />
        </div>

        {/* Collapsible results table */}
        {data && (
          <div className="p-3">
            <button
              className="flex w-full items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setResultsOpen(!resultsOpen)}
            >
              {resultsOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Results ({data.rowCount} rows, {data.elapsed.toFixed(1)}ms)
            </button>
            {resultsOpen && (
              <div className="mt-2 max-h-60 overflow-auto">
                <ResultsTable result={data} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
