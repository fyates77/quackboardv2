import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogPortal,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEngine } from "@/engine/use-engine";
import { useSemanticStore } from "@/stores/semantic-store";
import { buildJoinDDL, buildDropViewDDL } from "@/lib/semantic-sql";
import { createId } from "@/lib/id";
import type { SemanticJoin, JoinClause } from "@/types/semantic";

interface JoinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  join: SemanticJoin | null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const EMPTY_CLAUSE = (): JoinClause => ({
  id: createId(),
  type: "left",
  rightTableName: "",
  leftColumn: "",
  rightColumn: "",
  customCondition: "",
});

export function JoinDialog({ open, onOpenChange, join }: JoinDialogProps) {
  const engine = useEngine();
  const { upsertJoin } = useSemanticStore();

  const [name, setName] = useState("");
  const [tableName, setTableName] = useState("");
  const [description, setDescription] = useState("");
  const [baseTableName, setBaseTableName] = useState("");
  const [joinClauses, setJoinClauses] = useState<JoinClause[]>([EMPTY_CLAUSE()]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [ddlError, setDdlError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tableNameEdited, setTableNameEdited] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (join) {
      setName(join.name);
      setTableName(join.tableName);
      setDescription(join.description ?? "");
      setBaseTableName(join.baseTableName);
      setJoinClauses(join.joins.length > 0 ? join.joins : [EMPTY_CLAUSE()]);
      setTableNameEdited(true);
    } else {
      setName("");
      setTableName("");
      setDescription("");
      setBaseTableName("");
      setJoinClauses([EMPTY_CLAUSE()]);
      setTableNameEdited(false);
    }
    setDdlError(null);

    engine
      .executeQuery(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' ORDER BY table_name",
      )
      .then((r) => setAvailableTables(r.rows.map((row) => row.table_name as string)))
      .catch(() => setAvailableTables([]));
  }, [open, join, engine]);

  const handleNameChange = useCallback(
    (v: string) => {
      setName(v);
      if (!tableNameEdited) setTableName(slugify(v));
    },
    [tableNameEdited],
  );

  const addClause = () => setJoinClauses((c) => [...c, EMPTY_CLAUSE()]);

  const updateClause = (id: string, patch: Partial<JoinClause>) => {
    setJoinClauses((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeClause = (id: string) => {
    setJoinClauses((cs) => cs.filter((c) => c.id !== id));
  };

  const draft: SemanticJoin = {
    id: join?.id ?? "",
    name: name.trim(),
    tableName: tableName.trim(),
    description: description.trim() || undefined,
    baseTableName: baseTableName.trim(),
    joins: joinClauses,
    createdAt: join?.createdAt ?? "",
    updatedAt: "",
  };

  const previewSql =
    baseTableName && joinClauses.length > 0 && joinClauses[0].rightTableName
      ? (() => {
          try {
            return buildJoinDDL(draft);
          } catch {
            return "";
          }
        })()
      : "";

  const handleSave = async () => {
    if (!name.trim() || !tableName.trim() || !baseTableName.trim()) return;
    setSaving(true);
    setDdlError(null);

    const now = new Date().toISOString();
    const finalJoin: SemanticJoin = {
      ...draft,
      id: join?.id ?? createId(),
      createdAt: join?.createdAt ?? now,
      updatedAt: now,
    };

    try {
      await engine.executeDDL(buildJoinDDL(finalJoin));
      upsertJoin(finalJoin);
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
              {join ? "Edit Join" : "New Join"}
            </h2>

            {/* Name + tableName */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Orders with Customers"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  View name
                </label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm outline-none focus:ring-1 focus:ring-primary"
                  placeholder="orders_with_customers"
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
                placeholder="Orders enriched with customer details"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Base table */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Base table <span className="text-muted-foreground/60">(left-hand side)</span>
              </label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                value={baseTableName}
                onChange={(e) => setBaseTableName(e.target.value)}
              >
                <option value="">Select a table…</option>
                {availableTables.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Join clauses */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Joins</label>
                <button
                  onClick={addClause}
                  className="text-xs text-primary hover:underline"
                >
                  + Add join
                </button>
              </div>
              {joinClauses.map((jc, i) => (
                <JoinClauseRow
                  key={jc.id}
                  clause={jc}
                  index={i}
                  availableTables={availableTables}
                  onUpdate={(patch) => updateClause(jc.id, patch)}
                  onRemove={() => removeClause(jc.id)}
                  canRemove={joinClauses.length > 1}
                />
              ))}
            </div>

            {/* SQL preview */}
            {previewSql && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Generated SQL preview
                </label>
                <pre className="rounded-md bg-muted px-3 py-2 text-xs font-mono whitespace-pre-wrap break-all">
                  {previewSql}
                </pre>
              </div>
            )}

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
                disabled={!name.trim() || !tableName.trim() || !baseTableName.trim() || saving}
                onClick={handleSave}
              >
                {saving ? "Saving…" : join ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

function JoinClauseRow({
  clause,
  index,
  availableTables,
  onUpdate,
  onRemove,
  canRemove,
}: {
  clause: JoinClause;
  index: number;
  availableTables: string[];
  onUpdate: (patch: Partial<JoinClause>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const useCustom = !!clause.customCondition;

  return (
    <div className="rounded-md border border-border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium w-4">{index + 1}.</span>
        <select
          className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
          value={clause.type}
          onChange={(e) => onUpdate({ type: e.target.value as JoinClause["type"] })}
        >
          <option value="left">LEFT JOIN</option>
          <option value="inner">INNER JOIN</option>
          <option value="right">RIGHT JOIN</option>
          <option value="full">FULL JOIN</option>
        </select>
        <select
          className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
          value={clause.rightTableName}
          onChange={(e) => onUpdate({ rightTableName: e.target.value })}
        >
          <option value="">Right table…</option>
          {availableTables.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive text-xs px-1"
          >
            ✕
          </button>
        )}
      </div>

      {!useCustom ? (
        <div className="flex items-center gap-2 pl-6">
          <input
            className="flex-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-xs outline-none focus:ring-1 focus:ring-primary"
            placeholder="left_column"
            value={clause.leftColumn}
            onChange={(e) => onUpdate({ leftColumn: e.target.value })}
          />
          <span className="text-xs text-muted-foreground">=</span>
          <input
            className="flex-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-xs outline-none focus:ring-1 focus:ring-primary"
            placeholder="right_column"
            value={clause.rightColumn}
            onChange={(e) => onUpdate({ rightColumn: e.target.value })}
          />
          <button
            onClick={() => onUpdate({ customCondition: " " })}
            className="text-xs text-muted-foreground hover:text-primary whitespace-nowrap"
          >
            Custom ON
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 pl-6">
          <input
            className="flex-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-xs outline-none focus:ring-1 focus:ring-primary"
            placeholder={`base_table.id = right_table.base_id`}
            value={clause.customCondition ?? ""}
            onChange={(e) => onUpdate({ customCondition: e.target.value })}
          />
          <button
            onClick={() => onUpdate({ customCondition: "" })}
            className="text-xs text-muted-foreground hover:text-primary whitespace-nowrap"
          >
            Column picker
          </button>
        </div>
      )}
    </div>
  );
}

export { buildDropViewDDL };
