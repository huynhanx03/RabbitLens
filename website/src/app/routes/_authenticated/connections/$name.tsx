import { createFileRoute } from "@tanstack/react-router";
import { ConnectionDetailPage } from "@/features/connections/connection-detail-page";
import { resourceListSearchSchema } from "@/api/pagination-schema";
import { connectionDetailQueryOptions } from "@/domains/connections/connection-query";
import { channelKeys } from "@/domains/channels/channel-query";
import { getConnectionChannels } from "@/domains/channels/channel-api";
import { CHART_RANGES, buildRangeQueryParams, CONNECTION_RANGE_PREFIXES } from "@/config/chart-ranges";

export const Route = createFileRoute("/_authenticated/connections/$name")({
  validateSearch: resourceListSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, params, deps }) => {
    // Pre-fetch the connection detail
    context.queryClient.ensureQueryData(
      connectionDetailQueryOptions(
        context.apiClient,
        params.name,
        CHART_RANGES[0],
        buildRangeQueryParams(CHART_RANGES[0], CONNECTION_RANGE_PREFIXES),
      ),
    );

    // Pre-fetch the channels list
    context.queryClient.ensureQueryData({
      queryKey: channelKeys.connectionChannels(params.name, deps),
      queryFn: ({ signal }) =>
        getConnectionChannels(context.apiClient, params.name, deps, signal),
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { name } = Route.useParams();
  const search = Route.useSearch();
  return <ConnectionDetailPage name={name} channelsSearch={search} />;
}
