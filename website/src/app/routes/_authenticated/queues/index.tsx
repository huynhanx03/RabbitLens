import { createFileRoute } from "@tanstack/react-router";
import { QueueListPage } from "@/features/queues/queue-list-page";
import { resourceListSearchSchema } from "@/api/pagination-schema";
import { queueKeys } from "@/domains/queues/queue-query";
import { getQueues } from "@/domains/queues/queue-api";

export const Route = createFileRoute("/_authenticated/queues/")({
  validateSearch: resourceListSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData({
      queryKey: queueKeys.list(deps),
      queryFn: ({ signal }) => getQueues(context.apiClient, deps, signal),
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  return <QueueListPage search={search} />;
}
