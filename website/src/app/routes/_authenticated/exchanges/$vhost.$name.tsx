import { createFileRoute } from "@tanstack/react-router";
import { ExchangeDetailPage } from "@/features/exchanges/exchange-detail-page";
import { exchangeKeys } from "@/domains/exchanges/exchange-query";
import { getExchange } from "@/domains/exchanges/exchange-api";
import { CHART_RANGES, buildRangeQueryParams } from "@/config/chart-ranges";

export const Route = createFileRoute("/_authenticated/exchanges/$vhost/$name")({
  loader: async ({ context, params }) => {
    // Determine the actual name for the API call since TanStack Router 
    // might receive an encoded value if we navigated to a placeholder
    const apiName = params.name === "_default_" ? "" : params.name;
    
    context.queryClient.ensureQueryData({
      queryKey: [...exchangeKeys.detail(params.vhost, apiName), CHART_RANGES[0]],
      queryFn: ({ signal }) =>
        getExchange(
          context.apiClient,
          params.vhost,
          apiName,
          buildRangeQueryParams(CHART_RANGES[0], ["msg_rates"]),
          signal,
        ),
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { vhost, name } = Route.useParams();
  const apiName = name === "_default_" ? "" : name;
  return <ExchangeDetailPage vhost={vhost} name={apiName} />;
}
