import { useContext } from "react";
import { EngineContext } from "./engine-provider";
import type { QueryEngine } from "./types";

export function useEngine(): QueryEngine {
  const engine = useContext(EngineContext);
  if (!engine) {
    throw new Error("useEngine must be used within an EngineProvider");
  }
  return engine;
}
