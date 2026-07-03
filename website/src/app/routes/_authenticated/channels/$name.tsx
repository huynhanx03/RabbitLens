import { createFileRoute } from "@tanstack/react-router";
import { resourceListSearchSchema } from "@/api/pagination-schema";
import { ChannelDetailPage } from "@/features/channels/channel-detail-page";
import { channelDetailQueryOptions } from "@/domains/channels/channel-query";

export const Route = createFileRoute("/_authenticated/channels/$name")({
  validateSearch: resourceListSearchSchema,
  loader: ({ context, params }) => context.queryClient.ensureQueryData(channelDetailQueryOptions(context.apiClient, params.name, "current")),
  component: RouteComponent,
});

function RouteComponent() {
  return <ChannelDetailPage name={Route.useParams().name} />;
}
