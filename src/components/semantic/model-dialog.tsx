import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogPortal,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEngine } from "@/engine/use-engine";
import { useSemanticStore } from "@/stores/semantic-store";
import { buildModelDDL } from "@/lib/semantic-sql";
import { createId } from "@/lib/id";
import type { SemanticModel, SemanticColumn } from "@/types/semantic";

interface ModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: SemanticModel | null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function ModelDialog({ open, onOpenChange, model }: ModelDialogProps) {
  const engine = useEngine();
  const { upsertModel } = useSemanticStore();

  const [name, setName] = useState("");
  const [tableName, setTableName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState<"table" | "sql">("table");
  const [sourceTableName, setSourceTableName] = useState("");
  const [sourceSql, setSourceSql] = useState("");
  const [dimensions, setDimensions] = useState<SemanticColumn[]>([]);
  const [measures, setMeasures] = useState<SemanticColumn[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [ddlError, setDdlError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tableNameEdited, setTableNameEdited] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (model) {
      setName(model.name);
      setTableName(model.tableName);
      setDescription(model.description ?? "");
      setSourceType(model.sourceType);
      setSourceTableName(model.sourceTableName ?? "");
      setSourceSql(model.sourceSql ?? "");
      setDimensions(model.dimensions);
      setMeasures(model.measures);
      setTableNameEdited(true);
    } else {
      setName("");
      setTableName("");
      setDescription("");
      setSourceType("table");
      setSourceTableName("");
      setSourceSql("");
      setDimensions([]);
      setMeasures([]);
      setTableNameEdited(false);
    }
    setDdlError(null);

    engine
      .executeQuery(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' ORDER BY table_name",
      )
      .then((r) => setAvailableTables(r.rows.map((row) => row.table_name as string)))
      .catch(() => setAvailableTables([]));
  }, [open, model, engine]);

  const handleNameChange = useCallback(
    (v: string) => {
      setName(v);
      if (!tableNameEdited) setTableName(slugify(v));
    },
    [tableNameEdited],
  );

  const addColumn = (kind: "dimension" | "measure") => {
    const col: SemanticColumn = { id: createId(), name: "", label: "", dataType: "string" };
    if (kind === "dimension") setDimensions((d) => [...d, col]);
    else setMeasures((m) => [...m, col]);
  };

  const updateColumn = (
    kind: "dimension" | "measure",
    id: string,
    patch: Partial<SemanticColumn>,
  ) => {
    const updater = (cols: SemanticColumn[]) =>
      cols.map((c) => (c.id === id ? { ...c, ...patch } : c));
    if (kind === "dimension") setDimensions(updater);
    else setMeasures(updater);
  };

  const removeColumn = (kind: "dimension" | "measure", id: string) => {
    if (kind === "dimension") setDimensions((d) => d.filter((c) => c.id !== id));
    else setMeasures((m) => m.filter((c) => c.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim() || !tableName.trim()) return;
    setSaving(true);
    setDdlError(null);

    const now = new Date().toISOString();
    const draft: SemanticModel = {
      id: model?.id ?? createId(),
      name: name.trim(),
      tableName: tableName.trim(),
      description: description.trim() || undefined,
      sourceType,
      sourceTableName: sourceType === "table" ? sourceTableName : undefined,
      sourceSql: sourceType === "sql" ? sourceSql.trim() : undefined,
      dimensions,
      measures,
      createdAt: model?.createdAt ?? now,
      updatedAt: now,
    };

    try {
      await engine.executeDDL(buildModelDDL(draft));
      upsertModel(draft);
      onOpenChange(false);
    } catch (e) {
      setDdlError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <div className="space-y-5 p-1">
            <h2 className="text-lg font-semibold">
              {model ? "Edit Model" : "New Model"}
            </h2>

            {/* Name + tableName */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Customer Orders"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  View name{" "}
                  <span className="text-muted-foreground/60">(DuckDB identifier)</span>
                </label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm outline-none focus:ring-1 focus:ring-primary"
                  placeholder="customer_orders"
                  value={tableName}
                  onChange={(e) => {
                    setTableName(e.target.value);
                    setTableNameEdited(true);
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Description <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                placeholder="Orders joined with customer data"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Source type toggle */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Source</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSourceType("table")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    sourceType === "table"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setSourceType("sql")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    sourceType === "sql"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  SQL
                </button>
              </div>

              {sourceType === "table" ? (
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                  value={sourceTableName}
                  onChange={(e) => setSourceTableName(e.target.value)}
                >
                  <option value="">Select a table…</option>
                  {availableTables.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              ) : (
                <textarea
                  className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-y"
                  placeholder="SELECT * FROM orders JOIN customers USING (customer_id)"
                  value={sourceSql}
                  onChange={(e) => setSourceSql(e.target.value)}
                />
              )}
            </div>

            {/* Dimensions */}
            <ColumnList
              label="Dimensions"
              kind="dimension"
              columns={dimensions}
              onAdd={() => addColumn("dimension")}
              onUpdate={(id, p) => updateColumn("dimension", id, p)}
              onRemove={(id) => removeColumn("dimension", id)}
            />

            {/* Measures */}
            <ColumnList
              label="Measures"
              kind="measure"
              columns={measures}
              onAdd={() => addColumn("measure")}
              onUpdate={(id, p) => updateColumn("measure", id, p)}
              onRemove={(id) => removeColumn("measure", id)}
            />

            {/* DDL error */}
            {ddlError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive font-mono">
                {ddlError}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!name.trim() || !tableName.trim() || saving}
                onClick={handleSave}
              >
                {saving ? "Saving…" : model ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

interface ColumnListProps {
  label: string;
  kind: "dimension" | "measure";
  columns: SemanticColumn[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<SemanticColumn>) => void;
  onRemove: (id: string) => void;
}

function ColumnList({ label, columns, onAdd, onUpdate, onRemove }: ColumnListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <button
          onClick={onAdd}
          className="text-xs text-primary hover:underline"
        >
          + Add
        </button>
      </div>
      {columns.length === 0 && (
        <p className="text-xs text-muted-foreground/60 italic">No {label.toLowerCase()} defined</p>
      )}
      {columns.map((col) => (
        <div key={col.id} className="flex gap-2 items-center">
          <input
            className="flex-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-xs outline-none focus:ring-1 focus:ring-primary"
            placeholder="column_name"
            value={col.name}
            onChange={(e) => onUpdate(col.id, { name: e.target.value })}
          />
          <input
            className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
            placeholder="Human Label"
            value={col.label}
            onChange={(e) => onUpdate(col.id, { label: e.target.value })}
          />
          <select
            className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
            value={col.dataType ?? "string"}
            onChange={(e) =>
              onUpdate(col.id, {
                dataType: e.target.value as SemanticColumn["dataType"],
              })
            }
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="date">date</option>
            <option value="boolean">boolean</option>
          </select>
          <button
            onClick={() => onRemove(col.id)}
            className="text-muted-foreground hover:text-destructive text-xs px-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
