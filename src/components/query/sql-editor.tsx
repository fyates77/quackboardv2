import { useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { autocompletion } from "@codemirror/autocomplete";
import { keymap } from "@codemirror/view";
import { useUIStore } from "@/stores/ui-store";
import { useEngine } from "@/engine/use-engine";
import { createSchemaCompletionSource } from "./sql-completions";

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
}

export function SqlEditor({ value, onChange, onRun }: SqlEditorProps) {
  const theme = useUIStore((s) => s.theme);
  const engine = useEngine();

  const extensions = useMemo(() => {
    const runKeymap = keymap.of([
      {
        key: "Mod-Enter",
        run: () => {
          onRun();
          return true;
        },
      },
    ]);

    const schemaCompletion = createSchemaCompletionSource(engine);

    return [
      sql({ dialect: PostgreSQL }),
      autocompletion({
        override: [schemaCompletion],
        activateOnTyping: true,
      }),
      runKeymap,
    ];
  }, [engine, onRun]);

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange],
  );

  return (
    <CodeMirror
      value={value}
      onChange={handleChange}
      theme={theme}
      extensions={extensions}
      placeholder="SELECT * FROM your_table LIMIT 100"
      height="100%"
      className="h-full overflow-auto rounded border text-sm [&_.cm-editor]:h-full"
    />
  );
}
