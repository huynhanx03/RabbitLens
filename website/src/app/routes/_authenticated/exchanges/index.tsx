import { createFileRoute } from "@tanstack/react-router";
import { ExchangeListPage } from "@/features/exchanges/exchange-list-page";
import { resourceListSearchSchema } from "@/api/pagination-schema";
import { exchangeKeys } from "@/domains/exchanges/exchange-query";
import { getExchanges } from "@/domains/exchanges/exchange-api";

export const Route = createFileRoute("/_authenticated/exchanges/")({
  validateSearch: resourceListSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData({
      queryKey: exchangeKeys.list(deps),
      queryFn: ({ signal }) => getExchanges(context.apiClient, deps, signal),
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  return <ExchangeListPage search={search} />;
}
