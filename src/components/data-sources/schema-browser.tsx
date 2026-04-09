import { useMemo, useState } from "react";
import {
  ChevronRight,
  Table2,
  Hash,
  Type,
  Calendar,
  Layers,
  GitMerge,
  Zap,
} from "lucide-react";
import { useDataSourceStore } from "@/stores/data-source-store";
import { useSemanticStore } from "@/stores/semantic-store";
import { cn } from "@/lib/utils";
import type { ColumnInfo } from "@/engine/types";
import type { SemanticModel, SemanticJoin, SemanticMacro, SemanticColumn } from "@/types/semantic";

// Handles both DuckDB type strings ("INTEGER", "TIMESTAMP") and semantic type
// strings ("number", "date") so one function serves all nodes.
function typeIcon(type: string | undefined) {
  const t = (type ?? "").toUpperCase();
  if (
    t === "NUMBER" ||
    t.includes("INT") ||
    t.includes("FLOAT") ||
    t.includes("DOUBLE") ||
    t.includes("DECIMAL") ||
    t.includes("NUMERIC")
  ) {
    return <Hash className="h-3.5 w-3.5 text-blue-500" />;
  }
  if (t === "DATE" || t.includes("DATE") || t.includes("TIME") || t.includes("TIMESTAMP")) {
    return <Calendar className="h-3.5 w-3.5 text-orange-500" />;
  }
  return <Type className="h-3.5 w-3.5 text-green-500" />;
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-1.5 px-2 pt-3 pb-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
      <span className="text-[10px] text-muted-foreground/50">{count}</span>
    </div>
  );
}

function TreeNode({
  icon,
  label,
  badge,
  children,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm hover:bg-accent"
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform",
            expanded && "rotate-90",
          )}
        />
        {icon}
        {label}
        {badge}
      </button>
      {expanded && children && (
        <div className="ml-4 border-l pl-2">{children}</div>
      )}
    </>
  );
}

function ColumnGroup({ title, columns, badge }: {
  title: string;
  columns: SemanticColumn[];
  badge: (col: SemanticColumn) => React.ReactNode;
}) {
  if (columns.length === 0) return null;
  return (
    <>
      <p className="px-2 pt-1 text-[10px] text-muted-foreground/60 font-medium">{title}</p>
      {columns.map((col) => (
        <div key={col.id} className="flex items-center gap-1.5 px-2 py-0.5 text-xs">
          {typeIcon(col.dataType)}
          <span className="truncate">{col.name}</span>
          {col.label && col.label !== col.name && (
            <span className="ml-1 text-muted-foreground/60 truncate">{col.label}</span>
          )}
          {badge(col)}
        </div>
      ))}
    </>
  );
}

function TableNode({ tableName, columns }: { tableName: string; columns: ColumnInfo[] }) {
  return (
    <TreeNode
      icon={<Table2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      label={<span className="truncate font-medium">{tableName}</span>}
      badge={
        <span className="ml-auto text-xs text-muted-foreground">{columns.length}</span>
      }
    >
      {columns.map((col) => (
        <div key={col.name} className="flex items-center gap-1.5 px-2 py-0.5 text-xs">
          {typeIcon(col.type)}
          <span className="truncate">{col.name}</span>
          <span className="ml-auto shrink-0 text-muted-foreground">{col.type}</span>
        </div>
      ))}
    </TreeNode>
  );
}

function ModelNode({ model }: { model: SemanticModel }) {
  const noMeta = model.dimensions.length === 0 && model.measures.length === 0;

  return (
    <TreeNode
      icon={<Layers className="h-3.5 w-3.5 shrink-0 text-primary/70" />}
      label={<span className="truncate font-medium">{model.tableName}</span>}
      badge={
        <span className="ml-auto shrink-0 rounded bg-primary/10 px-1 text-[10px] text-primary">
          view
        </span>
      }
    >
      {model.description && (
        <p className="px-2 py-1 text-[10px] text-muted-foreground/70 italic">
          {model.description}
        </p>
      )}
      <p className="px-2 py-0.5 text-[10px] text-muted-foreground/50 uppercase tracking-wide">
        source: {model.sourceType === "table" ? model.sourceTableName : "SQL"}
      </p>
      <ColumnGroup
        title="Dimensions"
        columns={model.dimensions}
        badge={() => (
          <span className="ml-auto shrink-0 rounded bg-accent px-1 text-[10px] text-muted-foreground">
            dim
          </span>
        )}
      />
      <ColumnGroup
        title="Measures"
        columns={model.measures}
        badge={() => (
          <span className="ml-auto shrink-0 rounded bg-blue-500/10 px-1 text-[10px] text-blue-500">
            msr
          </span>
        )}
      />
      {noMeta && (
        <p className="px-2 py-1 text-[10px] text-muted-foreground/50 italic">
          No dimensions or measures defined
        </p>
      )}
    </TreeNode>
  );
}

function JoinNode({ join }: { join: SemanticJoin }) {
  return (
    <TreeNode
      icon={<GitMerge className="h-3.5 w-3.5 shrink-0 text-violet-500/80" />}
      label={<span className="truncate font-medium">{join.tableName}</span>}
      badge={
        <span className="ml-auto shrink-0 rounded bg-primary/10 px-1 text-[10px] text-primary">
          view
        </span>
      }
    >
      {join.description && (
        <p className="px-2 py-1 text-[10px] text-muted-foreground/70 italic">
          {join.description}
        </p>
      )}
      <div className="px-2 py-1 space-y-0.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Table2 className="h-3 w-3 shrink-0" />
          <span>{join.baseTableName}</span>
          <span className="text-muted-foreground/40 text-[10px]">base</span>
        </div>
        {join.joins.map((jc) => (
          <div key={jc.id} className="flex items-center gap-1.5 text-xs text-muted-foreground pl-2">
            <span className="text-[10px] text-muted-foreground/60 uppercase shrink-0">
              {jc.type}
            </span>
            <Table2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{jc.rightTableName}</span>
          </div>
        ))}
      </div>
    </TreeNode>
  );
}

function MacroNode({ macro }: { macro: SemanticMacro }) {
  const sig = `${macro.name}(${macro.parameters.map((p) => p.name).join(", ")})`;

  return (
    <TreeNode
      icon={<Zap className="h-3.5 w-3.5 shrink-0 text-amber-500/80" />}
      label={<code className="truncate text-xs font-mono">{sig}</code>}
      badge={
        macro.isBuiltin ? (
          <span className="ml-auto shrink-0 rounded bg-muted px-1 text-[10px] text-muted-foreground">
            built-in
          </span>
        ) : undefined
      }
    >
      {macro.description && (
        <p className="px-2 py-1 text-[10px] text-muted-foreground/70">{macro.description}</p>
      )}
      <div className="px-2 py-0.5">
        <code className="text-[10px] font-mono text-muted-foreground/70 break-all">
          {macro.body}
        </code>
      </div>
    </TreeNode>
  );
}

export function SchemaBrowser() {
  const dataSources = useDataSourceStore((s) => s.dataSources);
  const { models, joins, macros } = useSemanticStore(
    (s) => ({ models: s.models, joins: s.joins, macros: s.macros }),
  );

  const dsList = useMemo(() => Object.values(dataSources), [dataSources]);

  const modelList = useMemo(
    () => Object.values(models).sort((a, b) => a.name.localeCompare(b.name)),
    [models],
  );

  const joinList = useMemo(
    () => Object.values(joins).sort((a, b) => a.name.localeCompare(b.name)),
    [joins],
  );

  const macroList = useMemo(
    () =>
      Object.values(macros).sort((a, b) => {
        if (a.isBuiltin !== b.isBuiltin) return a.isBuiltin ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [macros],
  );

  if (!dsList.length && !modelList.length && !joinList.length && !macroList.length) {
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
      {dsList.length > 0 && (
        <>
          <SectionHeader label="Tables" count={dsList.length} />
          {dsList.map((ds) => (
            <TableNode key={ds.id} tableName={ds.tableName} columns={ds.columns} />
          ))}
        </>
      )}

      {modelList.length > 0 && (
        <>
          <SectionHeader label="Models" count={modelList.length} />
          {modelList.map((m) => (
            <ModelNode key={m.id} model={m} />
          ))}
        </>
      )}

      {joinList.length > 0 && (
        <>
          <SectionHeader label="Joins" count={joinList.length} />
          {joinList.map((j) => (
            <JoinNode key={j.id} join={j} />
          ))}
        </>
      )}

      {macroList.length > 0 && (
        <>
          <SectionHeader label="Macros" count={macroList.length} />
          {macroList.map((m) => (
            <MacroNode key={m.id} macro={m} />
          ))}
        </>
      )}
    </div>
  );
}
