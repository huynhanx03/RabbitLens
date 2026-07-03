import { createFileRoute } from "@tanstack/react-router";
import { VhostDetailPage } from "@/features/vhosts/vhost-detail-page";

export const Route = createFileRoute("/_authenticated/admin/vhosts/$name")({
  component: VhostDetailPage,
});
