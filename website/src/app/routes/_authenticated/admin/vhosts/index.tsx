import { createFileRoute } from "@tanstack/react-router";
import { VhostListPage } from "@/features/vhosts/vhost-list-page";

export const Route = createFileRoute("/_authenticated/admin/vhosts/")({
  component: VhostListPage,
});
