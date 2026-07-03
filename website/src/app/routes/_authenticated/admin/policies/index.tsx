import { createFileRoute } from "@tanstack/react-router";
import { PolicyListPage } from "@/features/policies/policy-list-page";

export const Route = createFileRoute("/_authenticated/admin/policies/")({
  component: PolicyListPage,
});
