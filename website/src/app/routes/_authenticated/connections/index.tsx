import { createFileRoute } from "@tanstack/react-router";
import { ConnectionListPage } from "@/features/connections/connection-list-page";
import { resourceListSearchSchema } from "@/api/pagination-schema";

export const Route = createFileRoute("/_authenticated/connections/")({
  validateSearch: resourceListSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <ConnectionListPage />;
}
