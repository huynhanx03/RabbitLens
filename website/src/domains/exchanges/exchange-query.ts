import type { ResourceListSearch } from "@/api/pagination-schema";

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPollingInterval } from "@/api/polling";
import type { ManagementApiClient } from "@/api/management-api-client";
import { buildRangeQueryParams, type ChartRange } from "@/config/chart-ranges";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import {
  createExchange,
  deleteExchange,
  getExchange,
  publishMessage,
  type CreateExchangeRequest,
  type PublishMessageRequest,
} from "./exchange-api";

export const exchangeKeys = {
  all: ["exchanges"] as const,
  lists: () => [...exchangeKeys.all, "list"] as const,
  list: (search: ResourceListSearch) =>
    [...exchangeKeys.lists(), search] as const,
  detail: (vhost: string, name: string) =>
    [...exchangeKeys.all, "detail", vhost, name] as const,
};

export function exchangeConfigQueryOptions(
  apiClient: ManagementApiClient,
  vhost: string,
  name: string,
) {
  const params = new URLSearchParams({ disable_stats: "true" });
  return queryOptions({
    queryKey: [...exchangeKeys.detail(vhost, name), "configuration"] as const,
    queryFn: ({ signal }) => getExchange(apiClient, vhost, name, params, signal),
    staleTime: 60_000,
  });
}

export function exchangeDetailQueryOptions(
  apiClient: ManagementApiClient,
  vhost: string,
  name: string,
  range: ChartRange,
) {
  const rangeParams = buildRangeQueryParams(range, ["msg_rates"]);
  return queryOptions({
    queryKey: [
      ...exchangeKeys.detail(vhost, name),
      "message-rates",
      range.ageSeconds,
      range.incrementSeconds,
    ] as const,
    queryFn: ({ signal }) =>
      getExchange(apiClient, vhost, name, rangeParams, signal),
    staleTime: PRODUCT_DEFAULTS.polling.nodeDetailsMs,
    refetchInterval: createPollingInterval(
      PRODUCT_DEFAULTS.polling.nodeDetailsMs,
    ),
  });
}

export function useCreateExchangeMutation(apiClient: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { vhost: string; name: string; request: CreateExchangeRequest }) => {
      await createExchange(apiClient, params.vhost, params.name, params.request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exchangeKeys.all });
    },
  });
}

export function useDeleteExchangeMutation(apiClient: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { vhost: string; name: string; ifUnused?: boolean }) => {
      await deleteExchange(apiClient, params.vhost, params.name, params.ifUnused);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exchangeKeys.all });
    },
  });
}

export function usePublishMessageMutation(apiClient: ManagementApiClient) {
  return useMutation({
    mutationFn: async (params: { vhost: string; name: string; request: PublishMessageRequest }) => {
      return await publishMessage(apiClient, params.vhost, params.name, params.request);
    },
  });
}
