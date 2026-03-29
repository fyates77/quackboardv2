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

/** Check if a column name looks like a hierarchical path (contains common delimiters). */
function looksLikePath(name: string): boolean {
  const n = name.toLowerCase();
  return n === "path" || n.includes("path") || n.includes("hierarchy");
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

  // Single VARCHAR column that looks like a path -> tree
  if (columns.length === 1 && categoricalCols.length === 1 && looksLikePath(categoricalCols[0].name)) {
    return {
      type: "tree",
      mapping: { path: categoricalCols[0].name },
      options: {},
    };
  }

  // 1 path-like VARCHAR + 1 numeric -> treemap
  if (
    categoricalCols.length === 1 &&
    numericCols.length === 1 &&
    columns.length === 2 &&
    looksLikePath(categoricalCols[0].name)
  ) {
    return {
      type: "treemap",
      mapping: { path: categoricalCols[0].name, value: numericCols[0].name },
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

  // 2 categorical + 1 numeric -> heatmap
  if (categoricalCols.length >= 2 && numericCols.length === 1) {
    return {
      type: "heatmap",
      mapping: {
        x: categoricalCols[0].name,
        y: categoricalCols[1].name,
        value: numericCols[0].name,
      },
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
