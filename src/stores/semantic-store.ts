import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { indexedDBStorage } from "./storage";
import { createId } from "@/lib/id";
import type { SemanticModel, SemanticJoin, SemanticMacro } from "@/types/semantic";

// Hardcoded IDs so built-ins are stable across cold re-inits
const BUILTIN_MACROS: SemanticMacro[] = [
  {
    id: "builtin_safe_divide",
    name: "safe_divide",
    label: "Safe Divide",
    description: "Divides two numbers, returning NULL instead of dividing by zero",
    category: "Math",
    parameters: [{ name: "numerator" }, { name: "denominator" }],
    body: "numerator / NULLIF(denominator, 0)",
    macroType: "scalar",
    isBuiltin: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "builtin_null_to_zero",
    name: "null_to_zero",
    label: "Null to Zero",
    description: "Converts NULL values to 0",
    category: "Math",
    parameters: [{ name: "value" }],
    body: "COALESCE(value, 0)",
    macroType: "scalar",
    isBuiltin: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "builtin_pct_of_total",
    name: "pct_of_total",
    label: "Percent of Total",
    description: "Calculates a value as a percentage of the window total",
    category: "Math",
    parameters: [{ name: "value" }],
    body: "value * 100.0 / NULLIF(SUM(value) OVER (), 0)",
    macroType: "scalar",
    isBuiltin: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "builtin_format_pct",
    name: "format_pct",
    label: "Format Percent",
    description: "Formats a number as a percentage string (e.g. 42.3%)",
    category: "Math",
    parameters: [{ name: "value" }],
    body: "printf('%.1f%%', COALESCE(value, 0))",
    macroType: "scalar",
    isBuiltin: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "builtin_yoy_growth",
    name: "yoy_growth",
    label: "Year-over-Year Growth %",
    description: "Calculates percentage growth from a prior period value to a current value",
    category: "Finance",
    parameters: [{ name: "current_value" }, { name: "prior_value" }],
    body: "(current_value - prior_value) * 100.0 / NULLIF(prior_value, 0)",
    macroType: "scalar",
    isBuiltin: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "builtin_days_between",
    name: "days_between",
    label: "Days Between",
    description: "Number of days between two dates",
    category: "Date",
    parameters: [{ name: "start_date" }, { name: "end_date" }],
    body: "DATEDIFF('day', start_date::DATE, end_date::DATE)",
    macroType: "scalar",
    isBuiltin: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "builtin_truncate_date",
    name: "truncate_date",
    label: "Truncate Date",
    description: "Truncates a timestamp to a specified grain: year, quarter, month, week, day",
    category: "Date",
    parameters: [{ name: "date_col" }, { name: "grain" }],
    body: "DATE_TRUNC(grain, date_col::TIMESTAMP)",
    macroType: "scalar",
    isBuiltin: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "builtin_running_total",
    name: "running_total",
    label: "Running Total",
    description: "Cumulative sum ordered by a position column",
    category: "Window",
    parameters: [{ name: "value" }, { name: "order_col" }],
    body: "SUM(value) OVER (ORDER BY order_col ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)",
    macroType: "scalar",
    isBuiltin: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];

const BUILTIN_MACROS_MAP: Record<string, SemanticMacro> = Object.fromEntries(
  BUILTIN_MACROS.map((m) => [m.id, m]),
);

interface SemanticState {
  models: Record<string, SemanticModel>;
  joins: Record<string, SemanticJoin>;
  macros: Record<string, SemanticMacro>;

  upsertModel(
    data: Omit<SemanticModel, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ): string;
  deleteModel(id: string): void;

  upsertJoin(
    data: Omit<SemanticJoin, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ): string;
  deleteJoin(id: string): void;

  upsertMacro(macro: SemanticMacro): string;
  deleteMacro(id: string): void;
}

export const useSemanticStore = create<SemanticState>()(
  persist(
    (set, get) => ({
      models: {},
      joins: {},
      macros: BUILTIN_MACROS_MAP,

      upsertModel(data) {
        const now = new Date().toISOString();
        const existing = data.id ? get().models[data.id] : undefined;
        const id = existing?.id ?? createId();
        const model: SemanticModel = {
          ...data,
          id,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        set((s) => ({ models: { ...s.models, [id]: model } }));
        return id;
      },

      deleteModel(id) {
        set((s) => {
          const { [id]: _, ...rest } = s.models;
          return { models: rest };
        });
      },

      upsertJoin(data) {
        const now = new Date().toISOString();
        const existing = data.id ? get().joins[data.id] : undefined;
        const id = existing?.id ?? createId();
        const join: SemanticJoin = {
          ...data,
          id,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        set((s) => ({ joins: { ...s.joins, [id]: join } }));
        return id;
      },

      deleteJoin(id) {
        set((s) => {
          const { [id]: _, ...rest } = s.joins;
          return { joins: rest };
        });
      },

      upsertMacro(macro) {
        set((s) => ({ macros: { ...s.macros, [macro.id]: macro } }));
        return macro.id;
      },

      deleteMacro(id) {
        set((s) => {
          if (s.macros[id]?.isBuiltin) return s;
          const { [id]: _, ...rest } = s.macros;
          return { macros: rest };
        });
      },
    }),
    {
      name: "quackboard-semantic",
      storage: createJSONStorage(() => indexedDBStorage),
      // Merge persisted state with initial built-ins so built-ins are always present
      merge(persisted, current) {
        const p = persisted as Partial<SemanticState>;
        return {
          ...current,
          ...p,
          macros: { ...BUILTIN_MACROS_MAP, ...(p.macros ?? {}) },
        };
      },
    },
  ),
);
