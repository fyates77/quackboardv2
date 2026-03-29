import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { exportDashboards, importDashboards } from "@/lib/export-import";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useUIStore();
  const importRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const count = await importDashboards(file);
      setImportMsg({
        type: "success",
        text: `Imported ${count} dashboard${count !== 1 ? "s" : ""}`,
      });
    } catch (err) {
      setImportMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Import failed",
      });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure Quackboard</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">
                  Choose between light and dark mode
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                >
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                >
                  Dark
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export All</p>
                <p className="text-sm text-muted-foreground">
                  Download all dashboards as a JSON file
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={exportDashboards}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Import</p>
                <p className="text-sm text-muted-foreground">
                  Restore dashboards from a previously exported file
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => importRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <input
                ref={importRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </div>

            {importMsg && (
              <div
                className={`flex items-center gap-2 rounded-md p-3 text-sm ${
                  importMsg.type === "success"
                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {importMsg.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                {importMsg.text}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Run query</span>
                <kbd className="glossy rounded-md border border-border/50 bg-muted/60 px-2 py-0.5 text-xs font-mono shadow-sm">
                  Cmd+Enter
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Close panel editor</span>
                <kbd className="glossy rounded-md border border-border/50 bg-muted/60 px-2 py-0.5 text-xs font-mono shadow-sm">
                  Escape
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toggle sidebar</span>
                <kbd className="glossy rounded-md border border-border/50 bg-muted/60 px-2 py-0.5 text-xs font-mono shadow-sm">
                  Cmd+B
                </kbd>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
