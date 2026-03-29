import { Link, useMatchRoute } from "@tanstack/react-router";
import { LayoutDashboard, Database, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { SchemaBrowser } from "@/components/data-sources/schema-browser";

const navItems = [
  { to: "/dashboards", label: "Dashboards", icon: LayoutDashboard },
  { to: "/data-sources", label: "Data Sources", icon: Database },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const matchRoute = useMatchRoute();

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b px-4">
        <Link to="/dashboards" className="flex items-center gap-2 font-bold">
          <span className="text-xl">Quackboard</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = matchRoute({ to, fuzzy: true });
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t">
        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tables
        </div>
        <div className="max-h-64 overflow-auto px-1 pb-3">
          <SchemaBrowser />
        </div>
      </div>
    </aside>
  );
}
