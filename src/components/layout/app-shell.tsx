import { useEffect, type ReactNode } from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  // Cmd+B to toggle sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <div className="aero-bg flex h-screen overflow-hidden">
      {sidebarOpen && <Sidebar />}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="glass flex h-14 items-center justify-between border-b border-border/40 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
