import { createFileRoute } from "@tanstack/react-router";
import { PolicyDetailPage } from "@/features/policies/policy-detail-page";

export const Route = createFileRoute("/_authenticated/admin/policies/$vhost/$name")({
  component: PolicyDetailPage,
});
