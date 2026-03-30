import { ChevronRight } from "lucide-react";
import { useInteractionStore } from "@/stores/interaction-store";

interface DrilldownBreadcrumbProps {
  panelId: string;
}

export function DrilldownBreadcrumb({ panelId }: DrilldownBreadcrumbProps) {
  const stack = useInteractionStore(
    (s) => s.drilldownStacks[panelId] ?? [],
  );
  const popDrilldownTo = useInteractionStore((s) => s.popDrilldownTo);
  const resetDrilldown = useInteractionStore((s) => s.resetDrilldown);

  if (stack.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-xs">
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => resetDrilldown(panelId)}
      >
        All
      </button>

      {stack.map((entry, i) => {
        const isLast = i === stack.length - 1;

        return (
          <span key={entry.level} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            {isLast ? (
              <span className="font-medium text-foreground">
                {entry.label}
              </span>
            ) : (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => popDrilldownTo(panelId, entry.level)}
              >
                {entry.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
