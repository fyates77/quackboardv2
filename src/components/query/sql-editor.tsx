import { useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { keymap } from "@codemirror/view";
import { useUIStore } from "@/stores/ui-store";

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
}

export function SqlEditor({ value, onChange, onRun }: SqlEditorProps) {
  const theme = useUIStore((s) => s.theme);

  const runKeymap = keymap.of([
    {
      key: "Mod-Enter",
      run: () => {
        onRun();
        return true;
      },
    },
  ]);

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
      extensions={[sql({ dialect: PostgreSQL }), runKeymap]}
      placeholder="SELECT * FROM your_table LIMIT 100"
      height="100%"
      className="h-full overflow-auto rounded border text-sm [&_.cm-editor]:h-full"
    />
  );
}
