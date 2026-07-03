import { createFileRoute } from "@tanstack/react-router";
import { ConnectionListPage } from "@/features/connections/connection-list-page";
import { resourceListSearchSchema } from "@/api/pagination-schema";
import { connectionListQueryOptions } from "@/domains/connections/connection-query";

export const Route = createFileRoute("/_authenticated/connections/")({
  validateSearch: resourceListSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    // Pre-fetch the list data
    await context.queryClient.ensureQueryData(
      connectionListQueryOptions(context.apiClient, deps),
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <ConnectionListPage />;
}
