import { createFileRoute } from "@tanstack/react-router";
import { ExchangeDetailPage } from "@/features/exchanges/exchange-detail-page";
import { exchangeDetailQueryOptions } from "@/domains/exchanges/exchange-query";
import { CHART_RANGES } from "@/config/chart-ranges";

export const Route = createFileRoute("/_authenticated/exchanges/$vhost/$name")({
  loader: ({ context, params }) => {
    // Determine the actual name for the API call since TanStack Router 
    // might receive an encoded value if we navigated to a placeholder
    const apiName = params.name === "_default_" ? "" : params.name;
    
    return context.queryClient.ensureQueryData(
      exchangeDetailQueryOptions(
        context.apiClient,
        params.vhost,
        apiName,
        CHART_RANGES[0],
      ),
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { vhost, name } = Route.useParams();
  const apiName = name === "_default_" ? "" : name;
  return <ExchangeDetailPage vhost={vhost} name={apiName} />;
}
