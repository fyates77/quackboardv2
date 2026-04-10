export type AggFn = "sum" | "avg" | "count" | "count_distinct" | "min" | "max";

export const AGG_LABELS: Record<AggFn, string> = {
  sum: "SUM",
  avg: "AVG",
  count: "COUNT",
  count_distinct: "COUNT DISTINCT",
  min: "MIN",
  max: "MAX",
};

export type FilterOp =
  | "="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<="
  | "IN"
  | "NOT IN"
  | "LIKE"
  | "IS NULL"
  | "IS NOT NULL";

export const FILTER_OPS: FilterOp[] = ["=", "!=", ">", "<", ">=", "<=", "IN", "NOT IN", "LIKE", "IS NULL", "IS NOT NULL"];

export interface BuilderDimension {
  id: string;
  column: string;
}

export interface BuilderMeasure {
  id: string;
  column: string;
  aggFn: AggFn;
  alias?: string;
}

export interface BuilderFilter {
  id: string;
  column: string;
  op: FilterOp;
  value?: string;
}

export interface BuilderConfig {
  table: string;
  dimensions: BuilderDimension[];
  measures: BuilderMeasure[];
  filters: BuilderFilter[];
  limit?: number;
  orderByColumn?: string;
  orderByDir?: "ASC" | "DESC";
}
