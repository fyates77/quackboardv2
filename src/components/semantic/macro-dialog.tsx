import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogPortal,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEngine } from "@/engine/use-engine";
import { useSemanticStore } from "@/stores/semantic-store";
import { buildMacroDDL } from "@/lib/semantic-sql";
import { createId } from "@/lib/id";
import type { SemanticMacro, MacroParameter } from "@/types/semantic";

interface MacroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  macro: SemanticMacro | null;
}

const PARAM_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function MacroDialog({ open, onOpenChange, macro }: MacroDialogProps) {
  const engine = useEngine();
  const { upsertMacro } = useSemanticStore();

  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [macroType, setMacroType] = useState<"scalar" | "table">("scalar");
  const [parameters, setParameters] = useState<MacroParameter[]>([{ name: "" }]);
  const [body, setBody] = useState("");
  const [ddlError, setDdlError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (macro) {
      setName(macro.name);
      setLabel(macro.label);
      setDescription(macro.description ?? "");
      setCategory(macro.category ?? "");
      setMacroType(macro.macroType);
      setParameters(macro.parameters.length > 0 ? macro.parameters : [{ name: "" }]);
      setBody(macro.body);
    } else {
      setName("");
      setLabel("");
      setDescription("");
      setCategory("");
      setMacroType("scalar");
      setParameters([{ name: "" }]);
      setBody("");
    }
    setDdlError(null);
  }, [open, macro]);

  const addParam = () => setParameters((p) => [...p, { name: "" }]);
  const updateParam = (i: number, val: string) =>
    setParameters((p) => p.map((x, j) => (j === i ? { ...x, name: val } : x)));
  const removeParam = (i: number) =>
    setParameters((p) => p.filter((_, j) => j !== i));

  const paramError = parameters.some(
    (p) => p.name.trim() && !PARAM_NAME_RE.test(p.name.trim()),
  );

  const handleSave = async () => {
    if (!name.trim() || !label.trim() || !body.trim()) return;
    if (paramError) return;
    setSaving(true);
    setDdlError(null);

    const cleanedParams = parameters
      .filter((p) => p.name.trim())
      .map((p) => ({ name: p.name.trim() }));

    const m: SemanticMacro = {
      id: macro?.id ?? createId(),
      name: name.trim(),
      label: label.trim(),
      description: description.trim() || undefined,
      category: category.trim() || undefined,
      macroType,
      parameters: cleanedParams,
      body: body.trim(),
      isBuiltin: false,
      createdAt: macro?.createdAt ?? new Date().toISOString(),
    };

    try {
      await engine.executeDDL(buildMacroDDL(m));
      upsertMacro(m);
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <div className="space-y-4 p-1">
            <h2 className="text-lg font-semibold">
              {macro ? "Edit Macro" : "New Macro"}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  SQL name{" "}
                  <span className="text-muted-foreground/60">(identifier)</span>
                </label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm outline-none focus:ring-1 focus:ring-primary"
                  placeholder="my_macro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Label</label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                  placeholder="My Macro"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Category <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Math"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <div className="flex gap-2 pt-0.5">
                  <button
                    onClick={() => setMacroType("scalar")}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      macroType === "scalar"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    Scalar
                  </button>
                  <button
                    onClick={() => setMacroType("table")}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      macroType === "table"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    Table
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Description <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                placeholder="What this macro does"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Parameters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  Parameters
                </label>
                <button onClick={addParam} className="text-xs text-primary hover:underline">
                  + Add
                </button>
              </div>
              {parameters.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={`flex-1 rounded-md border bg-background px-2 py-1 font-mono text-xs outline-none focus:ring-1 focus:ring-primary ${
                      p.name && !PARAM_NAME_RE.test(p.name)
                        ? "border-destructive"
                        : "border-border"
                    }`}
                    placeholder={`param${i + 1}`}
                    value={p.name}
                    onChange={(e) => updateParam(i, e.target.value)}
                  />
                  {parameters.length > 1 && (
                    <button
                      onClick={() => removeParam(i)}
                      className="text-muted-foreground hover:text-destructive text-xs px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {paramError && (
                <p className="text-xs text-destructive">
                  Parameter names must be valid SQL identifiers (letters, digits, underscores)
                </p>
              )}
            </div>

            {/* Body */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                SQL body{" "}
                <span className="text-muted-foreground/60">
                  {macroType === "scalar" ? "(expression)" : "(SELECT statement)"}
                </span>
              </label>
              <textarea
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-y"
                placeholder={
                  macroType === "scalar"
                    ? "numerator / NULLIF(denominator, 0)"
                    : "SELECT * FROM my_table WHERE col = param"
                }
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {/* DDL error */}
            {ddlError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive font-mono">
                {ddlError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={
                  !name.trim() || !label.trim() || !body.trim() || paramError || saving
                }
                onClick={handleSave}
              >
                {saving ? "Saving…" : macro ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
