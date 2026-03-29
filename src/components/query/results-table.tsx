import type { QueryResult } from "@/engine/types";

interface ResultsTableProps {
  result: QueryResult;
}

export function ResultsTable({ result }: ResultsTableProps) {
  if (result.rows.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        Query returned no rows
      </p>
    );
  }

  return (
    <div className="overflow-auto rounded border">
      <table className="w-full text-xs">
        <thead>
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
          {result.rows.map((row, i) => (
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
      <div className="border-t bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
        {result.rowCount} rows ({result.elapsed.toFixed(1)}ms)
      </div>
    </div>
  );
}
