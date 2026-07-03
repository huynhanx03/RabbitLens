import { createFileRoute } from "@tanstack/react-router";
import { resourceListSearchSchema } from "@/api/pagination-schema";
import { ChannelListPage } from "@/features/channels/channel-list-page";
import { channelListQueryOptions } from "@/domains/channels/channel-query";

export const Route = createFileRoute("/_authenticated/channels/")({
  validateSearch: resourceListSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(channelListQueryOptions(context.apiClient, deps)),
  component: ChannelListPage,
});
