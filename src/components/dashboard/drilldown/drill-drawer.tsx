import { X, Code2 } from "lucide-react";
import { useInteractionStore } from "@/stores/interaction-store";
import { ResultsTable } from "@/components/query/results-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QueryResult } from "@/engine/types";

interface DrillDrawerProps {
  panelId: string;
  panelTitle: string;
  result: QueryResult | null;
  sql?: string;
  showQuery?: boolean;
}

export function DrillDrawer({
  panelId,
  panelTitle,
  result,
  sql,
  showQuery,
}: DrillDrawerProps) {
  const dataDrawerPanelId = useInteractionStore((s) => s.dataDrawerPanelId);
  const setDataDrawerPanelId = useInteractionStore(
    (s) => s.setDataDrawerPanelId,
  );

  if (dataDrawerPanelId !== panelId) return null;

  return (
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 z-20 flex max-h-[50%] flex-col",
        "rounded-b-xl border-t border-border/40 bg-card/95 backdrop-blur-sm",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/30 px-3 py-1.5">
        <span className="flex-1 truncate text-xs font-medium">
          {panelTitle}
          {result && (
            <span className="ml-1.5 text-muted-foreground">
              ({result.rowCount} rows)
            </span>
          )}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setDataDrawerPanelId(null)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-2">
        {showQuery && sql && (
          <div className="mb-2 rounded border border-border/40 bg-muted/30 p-2">
            <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              <Code2 className="h-3 w-3" />
              SQL
            </div>
            <pre className="whitespace-pre-wrap text-xs text-foreground/80">
              {sql}
            </pre>
          </div>
        )}

        {result ? (
          <ResultsTable result={result} />
        ) : (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No data available
          </p>
        )}
      </div>
    </div>
  );
}
