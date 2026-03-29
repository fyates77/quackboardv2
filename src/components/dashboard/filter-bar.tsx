import { useCallback, useEffect, useState } from "react";
import { Plus, X, Filter } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useEngine } from "@/engine/use-engine";
import { createId } from "@/lib/id";
import { Button } from "@/components/ui/button";
import type { DashboardFilter, DashboardFilterType } from "@/types/dashboard";

interface FilterBarProps {
  dashboardId: string;
  filters: DashboardFilter[];
  filterValues: Record<string, string>;
  onFilterChange: (name: string, value: string) => void;
}

export function FilterBar({
  dashboardId,
  filters,
  filterValues,
  onFilterChange,
}: FilterBarProps) {
  const addFilter = useDashboardStore((s) => s.addFilter);
  const removeFilter = useDashboardStore((s) => s.removeFilter);
  const updateFilter = useDashboardStore((s) => s.updateFilter);
  const [adding, setAdding] = useState(false);

  const handleAdd = useCallback(
    (type: DashboardFilterType) => {
      const filter: DashboardFilter = {
        id: createId(),
        name: `filter_${(filters.length + 1).toString()}`,
        type,
      };
      addFilter(dashboardId, filter);
      setAdding(false);
    },
    [dashboardId, filters.length, addFilter],
  );

  if (filters.length === 0 && !adding) {
    return (
      <div className="flex items-center gap-2 pb-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground"
          onClick={() => setAdding(true)}
        >
          <Filter className="h-3 w-3" />
          Add filter
        </Button>
      </div>
    );
  }

  return (
    <div className="glass flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 mb-3">
      <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

      {filters.map((filter) => (
        <FilterControl
          key={filter.id}
          dashboardId={dashboardId}
          filter={filter}
          value={filterValues[filter.name] ?? ""}
          onChange={(val) => onFilterChange(filter.name, val)}
          onUpdate={(updates) =>
            updateFilter(dashboardId, filter.id, updates)
          }
          onRemove={() => {
            removeFilter(dashboardId, filter.id);
            onFilterChange(filter.name, "");
          }}
        />
      ))}

      {adding ? (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleAdd("select")}
          >
            Dropdown
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleAdd("date-range")}
          >
            Date
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleAdd("text")}
          >
            Text
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setAdding(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Add filter"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

// ── Individual filter control ──

interface FilterControlProps {
  dashboardId: string;
  filter: DashboardFilter;
  value: string;
  onChange: (value: string) => void;
  onUpdate: (updates: Partial<DashboardFilter>) => void;
  onRemove: () => void;
}

function FilterControl({
  filter,
  value,
  onChange,
  onUpdate,
  onRemove,
}: FilterControlProps) {
  const engine = useEngine();
  const [options, setOptions] = useState<string[]>([]);
  const [editingName, setEditingName] = useState(!filter.column && filter.type === "select");

  // Load distinct values for select filters
  useEffect(() => {
    if (filter.type !== "select" || !filter.column || !filter.table) return;
    let cancelled = false;

    (async () => {
      try {
        const col = filter.column!.replace(/'/g, "''");
        const table = filter.table!.replace(/'/g, "''");
        const result = await engine.executeQuery(
          `SELECT DISTINCT "${col}" FROM "${table}" ORDER BY "${col}" LIMIT 200`,
        );
        if (!cancelled) {
          setOptions(
            result.rows
              .map((r) => String(r[filter.column!] ?? ""))
              .filter(Boolean),
          );
        }
      } catch {
        // Silently fail - user might not have configured table/column yet
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [engine, filter.type, filter.column, filter.table]);

  return (
    <div className="flex items-center gap-1 rounded-md border border-border/50 bg-background/40 px-2 py-1">
      {editingName ? (
        <input
          autoFocus
          className="w-20 bg-transparent text-xs font-medium outline-none"
          placeholder="name"
          defaultValue={filter.name}
          onBlur={(e) => {
            const name = e.target.value.trim().replace(/\s+/g, "_") || filter.name;
            onUpdate({ name });
            setEditingName(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
      ) : (
        <span
          className="text-xs font-medium text-muted-foreground cursor-pointer"
          onDoubleClick={() => setEditingName(true)}
          title={`{{${filter.name}}} — double-click to rename`}
        >
          {filter.name}
        </span>
      )}

      {filter.type === "select" && (
        <>
          {!filter.column ? (
            <div className="flex items-center gap-1">
              <input
                className="w-16 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
                placeholder="table"
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    onUpdate({ table: e.target.value.trim() });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
              />
              <span className="text-xs text-muted-foreground">.</span>
              <input
                className="w-16 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
                placeholder="column"
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    onUpdate({ column: e.target.value.trim() });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
              />
            </div>
          ) : (
            <select
              className="max-w-40 bg-transparent text-xs outline-none"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="">All</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        </>
      )}

      {filter.type === "date-range" && (
        <input
          type="date"
          className="bg-transparent text-xs outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {filter.type === "text" && (
        <input
          className="w-24 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
          placeholder="value..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 shrink-0"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
