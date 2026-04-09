import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { DuckDBWasmEngine } from "./duckdb-wasm-engine";
import { rehydrateDataSources } from "./rehydrate-data-sources";
import { rehydrateSemanticLayer } from "./rehydrate-semantic-layer";
import type { QueryEngine } from "./types";

export const EngineContext = createContext<QueryEngine | null>(null);

interface EngineProviderProps {
  children: ReactNode;
  fallback: ReactNode;
}

export function EngineProvider({ children, fallback }: EngineProviderProps) {
  const [engine, setEngine] = useState<QueryEngine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eng = new DuckDBWasmEngine();
    let cancelled = false;

    eng
      .initialize()
      .then(async () => {
        await rehydrateDataSources(eng);
        await rehydrateSemanticLayer(eng);
        if (!cancelled) setEngine(eng);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      });

    return () => {
      cancelled = true;
      eng.destroy();
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive">
            Failed to initialize DuckDB
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!engine) {
    return <>{fallback}</>;
  }

  return (
    <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>
  );
}
