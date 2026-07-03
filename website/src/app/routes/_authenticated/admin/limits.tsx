import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/limits")({
  component: LimitsPage,
});

function LimitsPage() {
  return <Outlet />;
}
