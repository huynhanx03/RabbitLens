import { createFileRoute } from "@tanstack/react-router";
import { QueueDetailPage } from "@/features/queues/queue-detail-page";
import { queueKeys } from "@/domains/queues/queue-query";
import { getQueue } from "@/domains/queues/queue-api";
import { CHART_RANGES, buildRangeQueryParams, QUEUE_RANGE_PREFIXES } from "@/config/chart-ranges";

export const Route = createFileRoute("/_authenticated/queues/$vhost/$name")({
  loader: async ({ context, params }) => {
    context.queryClient.ensureQueryData({
      queryKey: [...queueKeys.detail(params.vhost, params.name), CHART_RANGES[0]],
      queryFn: ({ signal }) =>
        getQueue(
          context.apiClient,
          params.vhost,
          params.name,
          buildRangeQueryParams(CHART_RANGES[0], QUEUE_RANGE_PREFIXES),
          signal,
        ),
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { vhost, name } = Route.useParams();
  return <QueueDetailPage vhost={vhost} name={name} />;
}
