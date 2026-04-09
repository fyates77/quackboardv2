import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Full-viewport routes — skip AppShell nav
  if (pathname.startsWith("/view/") || /^\/dashboards\/[^/]+/.test(pathname)) {
    return <Outlet />;
  }
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
