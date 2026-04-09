export interface SemanticColumn {
  id: string;
  name: string;
  label: string;
  description?: string;
  dataType?: "string" | "number" | "date" | "boolean";
}

export interface SemanticModel {
  id: string;
  name: string;
  tableName: string;
  description?: string;
  sourceType: "table" | "sql";
  sourceTableName?: string;
  sourceSql?: string;
  dimensions: SemanticColumn[];
  measures: SemanticColumn[];
  createdAt: string;
  updatedAt: string;
}

export interface JoinClause {
  id: string;
  type: "inner" | "left" | "right" | "full";
  rightTableName: string;
  leftColumn: string;
  rightColumn: string;
  customCondition?: string;
}

export interface SemanticJoin {
  id: string;
  name: string;
  tableName: string;
  description?: string;
  baseTableName: string;
  joins: JoinClause[];
  createdAt: string;
  updatedAt: string;
}

export interface MacroParameter {
  name: string;
  description?: string;
}

export interface SemanticMacro {
  id: string;
  name: string;
  label: string;
  description?: string;
  category?: string;
  parameters: MacroParameter[];
  body: string;
  macroType: "scalar" | "table";
  isBuiltin: boolean;
  createdAt: string;
}
