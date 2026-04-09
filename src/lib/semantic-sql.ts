import type { SemanticModel, SemanticJoin, SemanticMacro } from "@/types/semantic";

function escapeIdent(name: string): string {
  return name.replace(/"/g, '""');
}

export function buildModelDDL(model: SemanticModel): string {
  const view = escapeIdent(model.tableName);
  if (model.sourceType === "table" && model.sourceTableName) {
    const src = escapeIdent(model.sourceTableName);
    return `CREATE OR REPLACE VIEW "${view}" AS SELECT * FROM "${src}"`;
  }
  if (model.sourceType === "sql" && model.sourceSql) {
    return `CREATE OR REPLACE VIEW "${view}" AS ${model.sourceSql}`;
  }
  throw new Error(`Model "${model.name}" has no source defined`);
}

export function buildJoinDDL(join: SemanticJoin): string {
  const view = escapeIdent(join.tableName);
  const base = escapeIdent(join.baseTableName);

  const clauses = join.joins
    .map((jc) => {
      const right = escapeIdent(jc.rightTableName);
      const condition = jc.customCondition
        ? jc.customCondition
        : `"${base}"."${escapeIdent(jc.leftColumn)}" = "${right}"."${escapeIdent(jc.rightColumn)}"`;
      return `${jc.type.toUpperCase()} JOIN "${right}" ON ${condition}`;
    })
    .join("\n  ");

  return `CREATE OR REPLACE VIEW "${view}" AS\nSELECT * FROM "${base}"\n  ${clauses}`;
}

export function buildMacroDDL(macro: SemanticMacro): string {
  const params = macro.parameters.map((p) => p.name).join(", ");
  if (macro.macroType === "scalar") {
    return `CREATE OR REPLACE MACRO ${macro.name}(${params}) AS (${macro.body})`;
  }
  return `CREATE OR REPLACE MACRO ${macro.name}(${params}) AS TABLE ${macro.body}`;
}

export function buildDropViewDDL(tableName: string): string {
  return `DROP VIEW IF EXISTS "${escapeIdent(tableName)}"`;
}

export function buildDropMacroDDL(macroName: string): string {
  return `DROP MACRO IF EXISTS ${macroName}`;
}
