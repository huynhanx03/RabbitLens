import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { createPollingInterval } from "@/api/polling";
import { capabilityKeys } from "@/capabilities/capability-queries";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import {
  getClusterName,
  putClusterName,
  resetAllStatistics,
  resetNodeStatistics,
} from "./cluster-api";

export const clusterKeys = {
  all: ["cluster"] as const,
  name: () => [...clusterKeys.all, "name"] as const,
};

export function clusterNameQueryOptions(client: ManagementApiClient) {
  return queryOptions({
    queryKey: clusterKeys.name(),
    queryFn: () => getClusterName(client),
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs),
  });
}

export function useSetClusterNameMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => putClusterName(client, name),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: clusterKeys.name() }),
  });
}

function useResetStatisticsMutation(
  reset: () => Promise<void>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: capabilityKeys.overview() });
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
    },
  });
}

export function useResetAllStatisticsMutation(client: ManagementApiClient) {
  return useResetStatisticsMutation(() => resetAllStatistics(client));
}

export function useResetNodeStatisticsMutation(
  client: ManagementApiClient,
  node: string,
) {
  return useResetStatisticsMutation(() => resetNodeStatistics(client, node));
}
