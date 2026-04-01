import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useInteractionStore } from "@/stores/interaction-store";
import { createId } from "@/lib/id";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { DashboardTab } from "@/types/dashboard";

interface TabBarProps {
  dashboardId: string;
  tabs: DashboardTab[];
}

export function TabBar({ dashboardId, tabs }: TabBarProps) {
  const activeTabs = useInteractionStore((s) => s.activeTabs);
  const setActiveTab = useInteractionStore((s) => s.setActiveTab);
  const setTabs = useDashboardStore((s) => s.setTabs);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState("");

  if (!tabs || tabs.length === 0) return null;

  const activeTabId = activeTabs[dashboardId] ?? tabs[0].id;

  const handleAddTab = () => {
    const id = createId();
    const newTab: DashboardTab = {
      id,
      label: `Tab ${tabs.length + 1}`,
      panelIds: [],
    };
    setTabs(dashboardId, [...tabs, newTab]);
    setActiveTab(dashboardId, id);
  };

  const handleRenameTab = (tabId: string) => {
    const trimmed = labelDraft.trim();
    if (trimmed) {
      setTabs(
        dashboardId,
        tabs.map((t) => (t.id === tabId ? { ...t, label: trimmed } : t)),
      );
    }
    setEditingId(null);
  };

  const handleDeleteTab = (tabId: string) => {
    const remaining = tabs.filter((t) => t.id !== tabId);
    setTabs(dashboardId, remaining);
    if (activeTabId === tabId && remaining.length > 0) {
      setActiveTab(dashboardId, remaining[0].id);
    }
  };

  return (
    <div className="flex items-center gap-0 border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div key={tab.id} className="group relative flex items-center">
            {editingId === tab.id ? (
              <form
                className="flex items-center gap-1 px-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRenameTab(tab.id);
                }}
              >
                <input
                  autoFocus
                  className="w-24 rounded border border-border/50 bg-background px-1.5 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  value={labelDraft}
                  onChange={(e) => setLabelDraft(e.target.value)}
                  onBlur={() => handleRenameTab(tab.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                >
                  <Check className="h-3 w-3" />
                </Button>
              </form>
            ) : (
              <button
                className={cn(
                  "h-9 px-3 text-sm transition-colors relative",
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setActiveTab(dashboardId, tab.id)}
                onDoubleClick={() => {
                  setEditingId(tab.id);
                  setLabelDraft(tab.label);
                }}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
                )}
              </button>
            )}

            {/* Delete button (visible on hover, only if more than 1 tab) */}
            {tabs.length > 1 && editingId !== tab.id && (
              <button
                className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive/80 text-white group-hover:flex"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTab(tab.id);
                }}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        );
      })}

      {/* Add tab button */}
      <button
        className="flex h-9 items-center gap-1 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={handleAddTab}
        title="Add tab"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
