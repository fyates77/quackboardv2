import { useEffect } from "react";
import { useInteractionStore } from "@/stores/interaction-store";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardParameter } from "@/types/dashboard";

interface ParameterBarProps {
  parameters: DashboardParameter[];
}

export function ParameterBar({ parameters }: ParameterBarProps) {
  const parameterValues = useInteractionStore((s) => s.parameterValues);
  const setParameterValue = useInteractionStore((s) => s.setParameterValue);

  // Initialize defaults for any parameter that doesn't have a value yet
  useEffect(() => {
    for (const param of parameters) {
      if (parameterValues[param.name] === undefined) {
        setParameterValue(param.name, param.default);
      }
    }
  }, [parameters, parameterValues, setParameterValue]);

  if (parameters.length === 0) return null;

  return (
    <div className="glass flex flex-wrap items-center gap-4 rounded-lg px-3 py-2 mb-3">
      <div className="flex items-center gap-1.5 shrink-0">
        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Parameters
        </span>
      </div>

      {parameters.map((param) => (
        <ParameterControl
          key={param.id}
          param={param}
          value={parameterValues[param.name] ?? param.default}
          onChange={(value) => setParameterValue(param.name, value)}
        />
      ))}
    </div>
  );
}

// ── Individual parameter control ──

interface ParameterControlProps {
  param: DashboardParameter;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
}

function ParameterControl({ param, value, onChange }: ParameterControlProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] font-medium text-muted-foreground leading-none">
        {param.label}
      </label>

      {param.type === "number" && (
        <NumberInput param={param} value={value} onChange={onChange} />
      )}

      {param.type === "text" && (
        <input
          type="text"
          className="w-28 rounded border border-border/50 bg-background/60 px-1.5 py-0.5 text-xs outline-none focus:border-primary/50"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {param.type === "select" && (
        <select
          className="rounded border border-border/50 bg-background/60 px-1.5 py-0.5 text-xs outline-none focus:border-primary/50"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        >
          {param.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {param.type === "toggle" && (
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(value)}
          className={cn(
            "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-border/50 transition-colors",
            Boolean(value) ? "bg-primary" : "bg-muted",
          )}
          onClick={() => onChange(!value)}
        >
          <span
            className={cn(
              "pointer-events-none block h-3 w-3 rounded-full bg-background shadow-sm transition-transform",
              Boolean(value) ? "translate-x-3" : "translate-x-0",
            )}
          />
        </button>
      )}
    </div>
  );
}

// ── Number input: slider when min/max defined, text input otherwise ──

function NumberInput({
  param,
  value,
  onChange,
}: ParameterControlProps) {
  const hasRange = param.min !== undefined && param.max !== undefined;

  if (!hasRange) {
    return (
      <input
        type="text"
        inputMode="numeric"
        className="w-20 rounded border border-border/50 bg-background/60 px-1.5 py-0.5 text-xs outline-none focus:border-primary/50"
        value={String(value)}
        onChange={(e) => {
          const num = Number(e.target.value);
          onChange(isNaN(num) ? e.target.value : num);
        }}
      />
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="range"
        min={param.min}
        max={param.max}
        step={param.step ?? 1}
        className="h-1 w-20 cursor-pointer accent-primary"
        value={Number(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="min-w-[2ch] text-xs tabular-nums text-muted-foreground">
        {value}
      </span>
    </div>
  );
}
