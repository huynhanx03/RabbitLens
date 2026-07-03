import { createFileRoute } from "@tanstack/react-router";
import { ClusterAdminPage } from "@/features/cluster/cluster-admin-page";

export const Route = createFileRoute("/_authenticated/admin/cluster")({
  component: ClusterAdminPage,
});
