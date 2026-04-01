import { useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { useUIStore } from "@/stores/ui-store";

interface JsEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function JsEditor({ value, onChange, placeholder }: JsEditorProps) {
  const theme = useUIStore((s) => s.theme);

  const extensions = useMemo(() => [javascript()], []);

  const handleChange = useCallback((val: string) => onChange(val), [onChange]);

  return (
    <CodeMirror
      value={value}
      onChange={handleChange}
      theme={theme}
      extensions={extensions}
      placeholder={placeholder ?? "// Write D3 visualization code here\nconst { container, data, d3, width, height } = ctx;"}
      height="100%"
      className="h-full overflow-auto text-sm [&_.cm-editor]:h-full"
    />
  );
}
