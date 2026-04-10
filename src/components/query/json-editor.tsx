import { useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { useUIStore } from "@/stores/ui-store";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
}

export function JsonEditor({ value, onChange, height = "100%" }: JsonEditorProps) {
  const theme = useUIStore((s) => s.theme);

  const extensions = useMemo(() => [json()], []);

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
      placeholder='{}'
      height={height}
      className="h-full overflow-auto rounded border text-sm [&_.cm-editor]:h-full"
    />
  );
}
