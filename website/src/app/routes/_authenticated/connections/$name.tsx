import { createFileRoute } from "@tanstack/react-router";
import { ConnectionDetailPage } from "@/features/connections/connection-detail-page";
import { resourceListSearchSchema } from "@/api/pagination-schema";

export const Route = createFileRoute("/_authenticated/connections/$name")({
  validateSearch: resourceListSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const { name } = Route.useParams();
  const search = Route.useSearch();
  return <ConnectionDetailPage name={name} channelsSearch={search} />;
}
