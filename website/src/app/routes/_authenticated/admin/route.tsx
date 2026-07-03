import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { evaluatePermission } from "@/auth/permissions/permission-decision";
import { ADMIN_ACCESS_POLICY } from "@/features/admin/admin-navigation";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    const decision = evaluatePermission(ADMIN_ACCESS_POLICY, context.auth.user, null);
    
    if (decision.kind === "deny") {
      throw redirect({
        to: "/",
      });
    }

    return {};
  },
  component: Outlet,
});
