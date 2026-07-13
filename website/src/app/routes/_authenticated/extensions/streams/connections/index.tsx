import { createFileRoute } from "@tanstack/react-router";
import { resourceListSearchSchema } from "@/api/pagination-schema";
import { ExtensionRouteGuard } from "@/extensions/extension-route-guard";
import { StreamConnectionListPage } from "@/features/streams/stream-connection-list-page";

export const Route = createFileRoute("/_authenticated/extensions/streams/connections/")({
  validateSearch: resourceListSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <ExtensionRouteGuard id="streams"><StreamConnectionListPage search={Route.useSearch()} /></ExtensionRouteGuard>;
}
