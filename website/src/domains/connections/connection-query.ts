import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import type { ResourceListSearch } from "@/api/pagination-schema";
import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { closeConnection, getConnection, getConnections } from "./connection-api";

export const connectionKeys = {
  all: ["connections"] as const,
  lists: () => [...connectionKeys.all, "list"] as const,
  list: (search: ResourceListSearch) =>
    [...connectionKeys.lists(), search] as const,
  detail: (name: string) =>
    [...connectionKeys.all, "detail", name] as const,
  children: (name: string, protocol: string) =>
    [...connectionKeys.detail(name), "children", protocol] as const,
};

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
  rangeKey: unknown,
  rangeParams?: URLSearchParams,
) {
  return queryOptions({
    queryKey: [...connectionKeys.detail(name), rangeKey],
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
