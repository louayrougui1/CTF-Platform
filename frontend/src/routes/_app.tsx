import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_app")({
  component: AppShellLayout,
});

function AppShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
