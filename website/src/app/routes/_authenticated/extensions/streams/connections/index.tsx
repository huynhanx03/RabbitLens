import { createFileRoute } from "@tanstack/react-router";
import { resourceListSearchSchema } from "@/api/pagination-schema";
import { streamConnectionListQueryOptions } from "@/domains/extensions/streams/stream-query";
import { ExtensionRouteGuard } from "@/extensions/extension-route-guard";
import { StreamConnectionListPage } from "@/features/streams/stream-connection-list-page";

export const Route = createFileRoute("/_authenticated/extensions/streams/connections/")({
  validateSearch: resourceListSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(streamConnectionListQueryOptions(context.apiClient, deps)),
  component: RouteComponent,
});

function RouteComponent() {
  return <ExtensionRouteGuard id="streams"><StreamConnectionListPage search={Route.useSearch()} /></ExtensionRouteGuard>;
}
