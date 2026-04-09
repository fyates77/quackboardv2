import type { QueryEngine } from "./types";
import { useSemanticStore } from "@/stores/semantic-store";
import {
  buildMacroDDL,
  buildModelDDL,
  buildJoinDDL,
} from "@/lib/semantic-sql";

export async function rehydrateSemanticLayer(engine: QueryEngine): Promise<void> {
  const { macros, models, joins } = useSemanticStore.getState();

  // Phase 1: macros — no dependencies, must exist before views can reference them
  for (const macro of Object.values(macros)) {
    try {
      await engine.executeDDL(buildMacroDDL(macro));
    } catch (e) {
      console.warn(`Failed to rehydrate macro "${macro.name}":`, e);
    }
  }

  // Phase 2: model views — depend on base data tables (already registered)
  for (const model of Object.values(models)) {
    try {
      await engine.executeDDL(buildModelDDL(model));
    } catch (e) {
      console.warn(`Failed to rehydrate model view "${model.tableName}":`, e);
    }
  }

  // Phase 3: join views — may reference model views from phase 2
  for (const join of Object.values(joins)) {
    try {
      await engine.executeDDL(buildJoinDDL(join));
    } catch (e) {
      console.warn(`Failed to rehydrate join view "${join.tableName}":`, e);
    }
  }
}
