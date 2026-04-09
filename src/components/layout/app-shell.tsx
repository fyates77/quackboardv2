import type { ReactNode } from "react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { to: "/dashboards", label: "Dashboards" },
  { to: "/data-sources", label: "Data" },
  { to: "/semantic", label: "Data Tools" },
  { to: "/play", label: "Play Pond" },
  { to: "/settings", label: "Settings" },
] as const;

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="aero-bg flex h-screen flex-col overflow-hidden">
      <header className="glass flex h-10 shrink-0 items-center border-b border-border/40 px-4 gap-4">
        {/* Logo */}
        <Link
          to="/dashboards"
          className="flex items-center gap-1.5 font-bold text-sm shrink-0"
        >
          <span className="text-base">🦆</span>
          <span>Quackboard</span>
        </Link>

        {/* Separator */}
        <div className="h-4 w-px bg-border/40 shrink-0" />

        {/* Nav links */}
        <AppShellNav />

        <div className="flex-1" />

        <ThemeToggle />
      </header>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}

function AppShellNav() {
  const matchRoute = useMatchRoute();

  return (
    <nav className="flex items-center gap-0.5">
      {NAV_ITEMS.map(({ to, label }) => {
        const isActive = matchRoute({ to, fuzzy: true });
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
