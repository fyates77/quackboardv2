import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useEngine } from "@/engine/use-engine";
import { useSemanticStore } from "@/stores/semantic-store";
import { buildDropViewDDL } from "@/lib/semantic-sql";
import { ModelDialog } from "./model-dialog";
import type { SemanticModel } from "@/types/semantic";

export function ModelsTab() {
  const engine = useEngine();
  const { models, deleteModel } = useSemanticStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SemanticModel | null>(null);

  const modelList = Object.values(models).sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt),
  );

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (model: SemanticModel) => {
    setEditing(model);
    setDialogOpen(true);
  };

  const handleDelete = async (model: SemanticModel) => {
    try {
      await engine.executeDDL(buildDropViewDDL(model.tableName));
    } catch {
      // View may not exist in current DuckDB session — proceed with store cleanup
    }
    deleteModel(model.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Models are DuckDB views that abstract source tables or SQL queries.
        </p>
        <Button size="sm" onClick={handleNew}>
          New Model
        </Button>
      </div>

      {modelList.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No models yet. Create one to define a reusable view over your data.
        </div>
      ) : (
        <div className="space-y-2">
          {modelList.map((model) => (
            <ModelRow
              key={model.id}
              model={model}
              onEdit={() => handleEdit(model)}
              onDelete={() => handleDelete(model)}
            />
          ))}
        </div>
      )}

      <ModelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        model={editing}
      />
    </div>
  );
}

function ModelRow({
  model,
  onEdit,
  onDelete,
}: {
  model: SemanticModel;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-border bg-card px-4 py-3">
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{model.name}</span>
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {model.tableName}
          </code>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {model.sourceType === "table" ? `← ${model.sourceTableName}` : "SQL"}
          </span>
        </div>
        {model.description && (
          <p className="text-xs text-muted-foreground truncate">{model.description}</p>
        )}
        <div className="flex gap-3 text-xs text-muted-foreground/70 pt-0.5">
          <span>{model.dimensions.length} dimensions</span>
          <span>{model.measures.length} measures</span>
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
