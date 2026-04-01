import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/view/")) {
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
