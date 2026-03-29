import type { ColumnInfo } from "@/engine/types";
import type { VisualizationConfig, VisualizationType } from "@/types/dashboard";

function isNumeric(type: string): boolean {
  const t = type.toUpperCase();
  return (
    t.includes("INT") ||
    t.includes("FLOAT") ||
    t.includes("DOUBLE") ||
    t.includes("DECIMAL") ||
    t.includes("NUMERIC") ||
    t.includes("BIGINT") ||
    t.includes("SMALLINT") ||
    t.includes("TINYINT") ||
    t.includes("HUGEINT") ||
    t.includes("REAL")
  );
}

function isTemporal(type: string): boolean {
  const t = type.toUpperCase();
  return t.includes("DATE") || t.includes("TIME") || t.includes("TIMESTAMP");
}

function isCategorical(type: string): boolean {
  return !isNumeric(type) && !isTemporal(type);
}

export function inferVisualization(
  columns: ColumnInfo[],
): VisualizationConfig {
  const numericCols = columns.filter((c) => isNumeric(c.type));
  const temporalCols = columns.filter((c) => isTemporal(c.type));
  const categoricalCols = columns.filter((c) => isCategorical(c.type));

  // Single numeric column -> KPI card
  if (columns.length === 1 && numericCols.length === 1) {
    return {
      type: "kpi",
      mapping: { value: numericCols[0].name },
      options: {},
    };
  }

  // 1 temporal/categorical + 1 numeric -> bar chart
  if (
    numericCols.length === 1 &&
    (temporalCols.length + categoricalCols.length) === 1
  ) {
    const xCol = temporalCols[0] ?? categoricalCols[0];
    const isTime = temporalCols.length > 0;
    const type: VisualizationType = isTime ? "line" : "bar";
    return {
      type,
      mapping: { x: xCol.name, y: numericCols[0].name },
      options: {},
    };
  }

  // 1 temporal/categorical + multiple numeric -> line chart
  if (
    numericCols.length >= 2 &&
    (temporalCols.length + categoricalCols.length) >= 1
  ) {
    const xCol = temporalCols[0] ?? categoricalCols[0];
    return {
      type: "line",
      mapping: {
        x: xCol.name,
        y: numericCols.map((c) => c.name),
      },
      options: {},
    };
  }

  // 2 numeric columns only -> scatter
  if (numericCols.length === 2 && columns.length === 2) {
    return {
      type: "scatter",
      mapping: { x: numericCols[0].name, y: numericCols[1].name },
      options: {},
    };
  }

  // Default: table
  return {
    type: "table",
    mapping: {},
    options: {},
  };
}
