import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import type { ResourceListSearch } from "@/api/pagination-schema";
import { createPollingInterval } from "@/api/polling";
import {
  buildRangeQueryParams,
  CONNECTION_RANGE_PREFIXES,
  type ChartRange,
} from "@/config/chart-ranges";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { closeConnection, getConnection, getConnections } from "./connection-api";
import { connectionKeys } from "./connection-keys";

export { connectionKeys } from "./connection-keys";

export function connectionListQueryOptions(
  client: ManagementApiClient,
  search: ResourceListSearch,
) {
  return queryOptions({
    queryKey: connectionKeys.list(search),
    queryFn: ({ signal }) => getConnections(client, search, signal),
    staleTime: PRODUCT_DEFAULTS.polling.heavyListsMs,
    refetchInterval: createPollingInterval(
      PRODUCT_DEFAULTS.polling.heavyListsMs,
    ),
  });
}

export function connectionDetailQueryOptions(
  client: ManagementApiClient,
  name: string,
  range: ChartRange,
) {
  const rangeParams = buildRangeQueryParams(range, CONNECTION_RANGE_PREFIXES);
  return queryOptions({
    queryKey: [
      ...connectionKeys.detail(name),
      "data-rates",
      range.ageSeconds,
      range.incrementSeconds,
    ] as const,
    queryFn: ({ signal }) =>
      getConnection(client, name, rangeParams, signal),
    refetchInterval: createPollingInterval(
      PRODUCT_DEFAULTS.polling.nodeDetailsMs,
    ),
  });
}

export function useCloseConnectionMutation(apiClient: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, reason }: { name: string; reason?: string }) => {
      await closeConnection(apiClient, name, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionKeys.all });
    },
  });
}
