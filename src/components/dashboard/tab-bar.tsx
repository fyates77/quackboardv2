import { useInteractionStore } from "@/stores/interaction-store";
import { cn } from "@/lib/utils";
import type { DashboardTab } from "@/types/dashboard";

interface TabBarProps {
  dashboardId: string;
  tabs: DashboardTab[];
}

export function TabBar({ dashboardId, tabs }: TabBarProps) {
  const activeTabs = useInteractionStore((s) => s.activeTabs);
  const setActiveTab = useInteractionStore((s) => s.setActiveTab);

  if (!tabs || tabs.length === 0) return null;

  const activeTabId = activeTabs[dashboardId] ?? tabs[0].id;

  return (
    <div className="flex items-center gap-0 border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            className={cn(
              "h-9 px-3 text-sm transition-colors relative",
              isActive
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setActiveTab(dashboardId, tab.id)}
          >
            {tab.label}
            {isActive && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
