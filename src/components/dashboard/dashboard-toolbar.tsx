import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2, Pencil, Check, X, ArrowLeft } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { Button } from "@/components/ui/button";
import type { Dashboard } from "@/types/dashboard";

interface DashboardToolbarProps {
  dashboard: Dashboard;
}

export function DashboardToolbar({ dashboard }: DashboardToolbarProps) {
  const navigate = useNavigate();
  const addPanel = useDashboardStore((s) => s.addPanel);
  const renameDashboard = useDashboardStore((s) => s.renameDashboard);
  const deleteDashboard = useDashboardStore((s) => s.deleteDashboard);

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(dashboard.name);

  const commitName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== dashboard.name) {
      renameDashboard(dashboard.id, trimmed);
    } else {
      setNameDraft(dashboard.name);
    }
    setEditing(false);
  };

  const handleDelete = () => {
    deleteDashboard(dashboard.id);
    navigate({ to: "/dashboards" });
  };

  return (
    <div className="flex items-center gap-3 pb-4">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => navigate({ to: "/dashboards" })}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {editing ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            commitName();
          }}
        >
          <input
            autoFocus
            className="rounded border bg-background px-2 py-1 text-xl font-bold outline-none focus:ring-2 focus:ring-ring"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setNameDraft(dashboard.name);
                setEditing(false);
              }
            }}
          />
          <Button type="submit" variant="ghost" size="icon" className="h-8 w-8">
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setNameDraft(dashboard.name);
              setEditing(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <h1
          className="cursor-pointer text-xl font-bold"
          onDoubleClick={() => setEditing(true)}
        >
          {dashboard.name}
        </h1>
      )}

      {!editing && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}

      <div className="flex-1" />

      <Button size="sm" onClick={() => addPanel(dashboard.id)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Panel
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={handleDelete}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
    </div>
  );
}
