import { useState } from "react";
import { ChevronRight, Table2, Hash, Type, Calendar } from "lucide-react";
import { useDataSourceStore } from "@/stores/data-source-store";
import { cn } from "@/lib/utils";
import type { ColumnInfo } from "@/engine/types";

function columnIcon(type: string) {
  const t = type.toUpperCase();
  if (
    t.includes("INT") ||
    t.includes("FLOAT") ||
    t.includes("DOUBLE") ||
    t.includes("DECIMAL") ||
    t.includes("NUMERIC") ||
    t.includes("BIGINT") ||
    t.includes("SMALLINT") ||
    t.includes("TINYINT") ||
    t.includes("HUGEINT")
  ) {
    return <Hash className="h-3.5 w-3.5 text-blue-500" />;
  }
  if (t.includes("DATE") || t.includes("TIME") || t.includes("TIMESTAMP")) {
    return <Calendar className="h-3.5 w-3.5 text-orange-500" />;
  }
  return <Type className="h-3.5 w-3.5 text-green-500" />;
}

function TableNode({
  tableName,
  columns,
}: {
  tableName: string;
  columns: ColumnInfo[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm hover:bg-accent"
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform",
            expanded && "rotate-90",
          )}
        />
        <Table2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium">{tableName}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {columns.length}
        </span>
      </button>

      {expanded && (
        <div className="ml-4 border-l pl-2">
          {columns.map((col) => (
            <div
              key={col.name}
              className="flex items-center gap-1.5 px-2 py-0.5 text-xs"
            >
              {columnIcon(col.type)}
              <span className="truncate">{col.name}</span>
              <span className="ml-auto shrink-0 text-muted-foreground">
                {col.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SchemaBrowser() {
  const dataSources = useDataSourceStore((s) => s.dataSources);
  const dsList = Object.values(dataSources);

  if (dsList.length === 0) {
    return (
      <div className="px-3 py-4 text-center text-xs text-muted-foreground">
        No tables loaded.
        <br />
        Upload files in Data Sources.
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-1">
      {dsList.map((ds) => (
        <TableNode key={ds.id} tableName={ds.tableName} columns={ds.columns} />
      ))}
    </div>
  );
}
