import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useEngine } from "@/engine/use-engine";
import { useSemanticStore } from "@/stores/semantic-store";
import { buildDropViewDDL } from "@/lib/semantic-sql";
import { JoinDialog } from "./join-dialog";
import type { SemanticJoin } from "@/types/semantic";

export function JoinsTab() {
  const engine = useEngine();
  const { joins, deleteJoin } = useSemanticStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SemanticJoin | null>(null);

  const joinList = Object.values(joins).sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt),
  );

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (join: SemanticJoin) => {
    setEditing(join);
    setDialogOpen(true);
  };

  const handleDelete = async (join: SemanticJoin) => {
    try {
      await engine.executeDDL(buildDropViewDDL(join.tableName));
    } catch {
      // View may not exist in current DuckDB session — proceed with store cleanup
    }
    deleteJoin(join.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Joins create DuckDB views that combine multiple tables into a single queryable surface.
        </p>
        <Button size="sm" onClick={handleNew}>
          New Join
        </Button>
      </div>

      {joinList.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No joins yet. Create one to combine tables into a reusable view.
        </div>
      ) : (
        <div className="space-y-2">
          {joinList.map((join) => (
            <JoinRow
              key={join.id}
              join={join}
              onEdit={() => handleEdit(join)}
              onDelete={() => handleDelete(join)}
            />
          ))}
        </div>
      )}

      <JoinDialog open={dialogOpen} onOpenChange={setDialogOpen} join={editing} />
    </div>
  );
}

function JoinRow({
  join,
  onEdit,
  onDelete,
}: {
  join: SemanticJoin;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-border bg-card px-4 py-3">
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{join.name}</span>
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {join.tableName}
          </code>
        </div>
        {join.description && (
          <p className="text-xs text-muted-foreground truncate">{join.description}</p>
        )}
        <div className="flex gap-1 flex-wrap pt-0.5">
          <span className="text-xs text-muted-foreground/70">
            {join.baseTableName}
          </span>
          {join.joins.map((jc, i) => (
            <span key={i} className="text-xs text-muted-foreground/70">
              → {jc.type.toUpperCase()} JOIN {jc.rightTableName}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-4">
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
