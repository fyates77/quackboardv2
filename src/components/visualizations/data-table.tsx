import { useState } from "react";
import type { QueryResult } from "@/engine/types";
import type { VisualizationOptions } from "@/types/dashboard";

interface DataTableProps {
  result: QueryResult;
  options: VisualizationOptions;
}

export function DataTable({ result, options }: DataTableProps) {
  const pageSize = options.pageSize ?? 50;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(result.rows.length / pageSize);
  const pageRows = result.rows.slice(page * pageSize, (page + 1) * pageSize);

  if (result.rows.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        No data
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b bg-muted/50">
              {result.columns.map((col) => (
                <th
                  key={col.name}
                  className="whitespace-nowrap px-2 py-1.5 text-left font-medium"
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={i} className="border-b last:border-0">
                {result.columns.map((col) => (
                  <td key={col.name} className="whitespace-nowrap px-2 py-1">
                    {row[col.name] == null ? (
                      <span className="text-muted-foreground">NULL</span>
                    ) : (
                      String(row[col.name])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-2 py-1 text-xs text-muted-foreground">
          <span>
            {result.rowCount} rows | Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              className="rounded px-2 py-0.5 hover:bg-muted disabled:opacity-40"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </button>
            <button
              className="rounded px-2 py-0.5 hover:bg-muted disabled:opacity-40"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
