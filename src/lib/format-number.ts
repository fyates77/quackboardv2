import type { VisualizationOptions, ThresholdRule } from "@/types/dashboard";

type NumberFormat = NonNullable<VisualizationOptions["numberFormat"]>;

/**
 * Format a numeric value for display using the specified format style.
 */
export function formatNumber(
  value: unknown,
  format: NumberFormat = "auto",
  options?: {
    decimals?: number;
    currencyCode?: string;
  },
): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value ?? "—");

  const decimals = options?.decimals;

  switch (format) {
    case "compact": {
      const abs = Math.abs(num);
      if (abs >= 1_000_000_000) {
        return formatFixed(num / 1_000_000_000, decimals ?? 1) + "B";
      }
      if (abs >= 1_000_000) {
        return formatFixed(num / 1_000_000, decimals ?? 1) + "M";
      }
      if (abs >= 1_000) {
        return formatFixed(num / 1_000, decimals ?? 1) + "K";
      }
      return formatFixed(num, decimals ?? 0);
    }

    case "percent":
      return formatFixed(num * 100, decimals ?? 1) + "%";

    case "currency": {
      const code = options?.currencyCode ?? "USD";
      try {
        return num.toLocaleString(undefined, {
          style: "currency",
          currency: code,
          minimumFractionDigits: decimals ?? 0,
          maximumFractionDigits: decimals ?? 0,
        });
      } catch {
        // Fallback if currency code is invalid
        return "$" + formatFixed(num, decimals ?? 0);
      }
    }

    case "integer":
      return Math.round(num).toLocaleString();

    case "auto":
    default:
      return num.toLocaleString(undefined, {
        maximumFractionDigits: decimals ?? 2,
      });
  }
}

function formatFixed(num: number, digits: number): string {
  // Use toLocaleString for comma separators
  return num.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * Evaluate threshold rules against a numeric value.
 * Returns the first matching rule, or undefined if none match.
 */
export function evaluateThresholds(
  value: number,
  rules?: ThresholdRule[],
): ThresholdRule | undefined {
  if (!rules || rules.length === 0) return undefined;

  for (const rule of rules) {
    switch (rule.operator) {
      case "gt":
        if (value > rule.value) return rule;
        break;
      case "gte":
        if (value >= rule.value) return rule;
        break;
      case "lt":
        if (value < rule.value) return rule;
        break;
      case "lte":
        if (value <= rule.value) return rule;
        break;
      case "between":
        if (
          rule.value2 !== undefined &&
          value >= rule.value &&
          value <= rule.value2
        )
          return rule;
        break;
    }
  }
  return undefined;
}
