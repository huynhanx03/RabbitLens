import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/definitions")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/cluster" });
  },
});
