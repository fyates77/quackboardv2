import { X } from "lucide-react";
import { useInteractionStore } from "@/stores/interaction-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QueryResult } from "@/engine/types";

interface RecordDetailProps {
  result: QueryResult;
  fields?: string[];
}

export function RecordDetail({ result, fields }: RecordDetailProps) {
  const recordDetail = useInteractionStore((s) => s.recordDetail);
  const setRecordDetail = useInteractionStore((s) => s.setRecordDetail);

  if (!recordDetail) return null;

  const row = result.rows[recordDetail.rowIndex];
  if (!row) return null;

  const columnsToShow = fields
    ? fields.filter((f) => result.columns.some((c) => c.name === f))
    : result.columns.map((c) => c.name);

  return (
    <div
      className={cn(
        "absolute inset-y-0 right-0 z-30 flex w-72 flex-col",
        "rounded-r-xl border-l border-border/40 bg-card/95 backdrop-blur-sm shadow-lg",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/30 px-3 py-2">
        <span className="flex-1 text-xs font-medium">
          Row {recordDetail.rowIndex + 1}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setRecordDetail(null)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Field list */}
      <div className="flex-1 overflow-auto p-2">
        <ul className="space-y-2">
          {columnsToShow.map((colName) => (
            <li key={colName}>
              <div className="text-[10px] font-medium text-muted-foreground">
                {colName}
              </div>
              <div className="mt-0.5 break-words text-xs text-foreground">
                {row[colName] == null ? (
                  <span className="text-muted-foreground">NULL</span>
                ) : (
                  String(row[colName])
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
