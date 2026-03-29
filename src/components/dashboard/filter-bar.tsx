import { useEffect, useState } from "react";
import { Plus, X, Filter } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useEngine } from "@/engine/use-engine";
import { createId } from "@/lib/id";
import { Button } from "@/components/ui/button";
import type { DashboardFilter, DashboardFilterType } from "@/types/dashboard";
import type { ColumnInfo } from "@/engine/types";

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
  const [adding, setAdding] = useState(false);

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
        <FilterChip
          key={filter.id}
          filter={filter}
          value={filterValues[filter.name] ?? ""}
          onChange={(val) => onFilterChange(filter.name, val)}
          onRemove={() => {
            removeFilter(dashboardId, filter.id);
            onFilterChange(filter.name, "");
          }}
        />
      ))}

      {adding ? (
        <SchemaPicker
          onSelect={(filter) => {
            addFilter(dashboardId, filter);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
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

// ── Schema picker: table → column → auto-create filter ──

interface SchemaPickerProps {
  onSelect: (filter: DashboardFilter) => void;
  onCancel: () => void;
}

function inferFilterType(colType: string): DashboardFilterType {
  const t = colType.toLowerCase();
  if (t.includes("date") || t.includes("time") || t.includes("timestamp")) {
    return "date-range";
  }
  if (
    t.includes("varchar") ||
    t.includes("text") ||
    t.includes("enum") ||
    t.includes("bool")
  ) {
    return "select";
  }
  // Integers with likely low cardinality (e.g. category IDs) → select
  // High cardinality numbers → text
  return "select";
}

function SchemaPicker({ onSelect, onCancel }: SchemaPickerProps) {
  const engine = useEngine();
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);

  // Load tables on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await engine.listTables();
        if (!cancelled) setTables(t);
      } catch {
        // engine not ready
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [engine]);

  // Load columns when table selected
  useEffect(() => {
    if (!selectedTable) return;
    let cancelled = false;
    (async () => {
      try {
        const cols = await engine.describeTable(selectedTable);
        if (!cancelled) setColumns(cols);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [engine, selectedTable]);

  const handleColumnSelect = (col: ColumnInfo) => {
    const filterType = inferFilterType(col.type);
    const filter: DashboardFilter = {
      id: createId(),
      name: col.name,
      type: filterType,
      table: selectedTable!,
      column: col.name,
    };
    onSelect(filter);
  };

  return (
    <div className="flex items-center gap-1 rounded-md border border-border/50 bg-background/60 px-2 py-1 backdrop-blur-sm">
      {!selectedTable ? (
        <>
          <select
            autoFocus
            className="bg-transparent text-xs outline-none"
            value=""
            onChange={(e) => {
              if (e.target.value) setSelectedTable(e.target.value);
            }}
          >
            <option value="" disabled>
              {tables.length === 0 ? "No tables loaded" : "Select table..."}
            </option>
            {tables.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onCancel}
          >
            <X className="h-3 w-3" />
          </Button>
        </>
      ) : (
        <>
          <span className="text-xs text-muted-foreground">{selectedTable}.</span>
          <select
            autoFocus
            className="bg-transparent text-xs outline-none"
            value=""
            onChange={(e) => {
              const col = columns.find((c) => c.name === e.target.value);
              if (col) handleColumnSelect(col);
            }}
          >
            <option value="" disabled>
              Select column...
            </option>
            {columns.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => {
              setSelectedTable(null);
              setColumns([]);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}

// ── Filter chip: shows value control + template hint ──

interface FilterChipProps {
  filter: DashboardFilter;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
}

function FilterChip({ filter, value, onChange, onRemove }: FilterChipProps) {
  const engine = useEngine();
  const [options, setOptions] = useState<string[]>([]);

  // Load distinct values for select filters
  useEffect(() => {
    if (filter.type !== "select" || !filter.column || !filter.table) return;
    let cancelled = false;

    (async () => {
      try {
        const col = filter.column!.replace(/"/g, '""');
        const table = filter.table!.replace(/"/g, '""');
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
        // table/column might not exist
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [engine, filter.type, filter.column, filter.table]);

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border/50 bg-background/40 px-2 py-1">
      <span
        className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary cursor-default select-all"
        title="Use this in your SQL query"
      >
        {`{{${filter.name}}}`}
      </span>

      {filter.type === "select" && (
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
