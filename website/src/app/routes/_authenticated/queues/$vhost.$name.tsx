import { createFileRoute } from "@tanstack/react-router";
import { QueueDetailPage } from "@/features/queues/queue-detail-page";
import { queueDetailQueryOptions } from "@/domains/queues/queue-query";
import { CHART_RANGES } from "@/config/chart-ranges";

export const Route = createFileRoute("/_authenticated/queues/$vhost/$name")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      queueDetailQueryOptions(
        context.apiClient,
        params.vhost,
        params.name,
        CHART_RANGES[0],
      ),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { vhost, name } = Route.useParams();
  return <QueueDetailPage vhost={vhost} name={name} />;
}
