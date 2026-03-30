import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X } from "lucide-react";
import { useInteractionStore } from "@/stores/interaction-store";
import { cn } from "@/lib/utils";
import type { Panel } from "@/types/dashboard";

interface SearchPaletteProps {
  panels: Panel[];
  onSelectPanel: (panelId: string) => void;
}

export function SearchPalette({ panels, onSelectPanel }: SearchPaletteProps) {
  const searchOpen = useInteractionStore((s) => s.searchOpen);
  const setSearchOpen = useInteractionStore((s) => s.setSearchOpen);

  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return panels.slice(0, 10);
    const q = query.toLowerCase();
    return panels.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 10);
  }, [panels, query]);

  // Reset state when opening
  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setHighlightIndex(0);
      // Auto-focus after the modal renders
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [searchOpen]);

  // Keep highlight in bounds when results change
  useEffect(() => {
    setHighlightIndex(0);
  }, [results.length]);

  if (!searchOpen) return null;

  const close = () => setSearchOpen(false);

  const selectPanel = (panelId: string) => {
    onSelectPanel(panelId);
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex(
        (i) => (i - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1),
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[highlightIndex]) {
        selectPanel(results[highlightIndex].id);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[20vh]"
      onClick={close}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-border bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search panels..."
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setQuery("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto p-1">
          {results.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No panels found
            </div>
          ) : (
            results.map((panel, i) => (
              <button
                key={panel.id}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  i === highlightIndex
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent/50",
                )}
                onClick={() => selectPanel(panel.id)}
                onMouseEnter={() => setHighlightIndex(i)}
              >
                <span className="flex-1 truncate">{panel.title}</span>
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {panel.visualization.type}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
