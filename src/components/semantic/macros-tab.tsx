import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useEngine } from "@/engine/use-engine";
import { useSemanticStore } from "@/stores/semantic-store";
import { buildDropMacroDDL } from "@/lib/semantic-sql";
import { MacroDialog } from "./macro-dialog";
import type { SemanticMacro } from "@/types/semantic";

export function MacrosTab() {
  const engine = useEngine();
  const { macros, deleteMacro } = useSemanticStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SemanticMacro | null>(null);

  const builtins = Object.values(macros).filter((m) => m.isBuiltin);
  const userMacros = Object.values(macros)
    .filter((m) => !m.isBuiltin)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // Group builtins by category
  const builtinsByCategory = builtins.reduce<Record<string, SemanticMacro[]>>((acc, m) => {
    const cat = m.category ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (macro: SemanticMacro) => {
    setEditing(macro);
    setDialogOpen(true);
  };

  const handleDelete = async (macro: SemanticMacro) => {
    try {
      await engine.executeDDL(buildDropMacroDDL(macro.name));
    } catch {
      // Macro may not exist in current session — proceed
    }
    deleteMacro(macro.id);
  };

  return (
    <div className="space-y-6">
      {/* Built-in gallery */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Built-in Macros</h3>
        <p className="text-xs text-muted-foreground">
          Available in every DuckDB session. Use them directly in panel SQL.
        </p>
        {Object.entries(builtinsByCategory).map(([category, items]) => (
          <div key={category} className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wide">
              {category}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {items.map((m) => (
                <BuiltinCard key={m.id} macro={m} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User macros */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Your Macros</h3>
          <Button size="sm" onClick={handleNew}>
            New Macro
          </Button>
        </div>

        {userMacros.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No custom macros yet. Create one to define reusable SQL expressions.
          </div>
        ) : (
          <div className="space-y-2">
            {userMacros.map((m) => (
              <MacroRow
                key={m.id}
                macro={m}
                onEdit={() => handleEdit(m)}
                onDelete={() => handleDelete(m)}
              />
            ))}
          </div>
        )}
      </div>

      <MacroDialog open={dialogOpen} onOpenChange={setDialogOpen} macro={editing} />
    </div>
  );
}

function BuiltinCard({ macro }: { macro: SemanticMacro }) {
  const paramSig = macro.parameters.map((p) => p.name).join(", ");
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 space-y-1">
      <div className="flex items-center gap-2">
        <code className="text-xs font-mono font-semibold">
          {macro.name}({paramSig})
        </code>
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary font-medium">
          built-in
        </span>
      </div>
      {macro.description && (
        <p className="text-xs text-muted-foreground">{macro.description}</p>
      )}
      <code className="block text-xs font-mono text-muted-foreground/80 truncate">
        {macro.body}
      </code>
    </div>
  );
}

function MacroRow({
  macro,
  onEdit,
  onDelete,
}: {
  macro: SemanticMacro;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const paramSig = macro.parameters.map((p) => p.name).join(", ");
  return (
    <div className="flex items-start justify-between rounded-lg border border-border bg-card px-4 py-3">
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{macro.label}</span>
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {macro.name}({paramSig})
          </code>
          {macro.category && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {macro.category}
            </span>
          )}
        </div>
        {macro.description && (
          <p className="text-xs text-muted-foreground">{macro.description}</p>
        )}
        <code className="block text-xs font-mono text-muted-foreground/70 truncate">
          {macro.body}
        </code>
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
