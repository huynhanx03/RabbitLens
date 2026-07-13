import type { ResourceListSearch } from "@/api/pagination-schema";

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import {
  createQueue,
  deleteQueue,
  getMessages,
  getQueue,
  purgeQueue,
  runQueueAction,
  type CreateQueueRequest,
  type GetMessagesRequest,
  type QueueAction,
} from "./queue-api";
import {
  buildRangeQueryParams,
  QUEUE_RANGE_PREFIXES,
  type ChartRange,
} from "@/config/chart-ranges";
import { PRODUCT_DEFAULTS } from "@/config/defaults";

export const queueKeys = {
  all: ["queues"] as const,
  lists: () => [...queueKeys.all, "list"] as const,
  list: (search: ResourceListSearch) =>
    [...queueKeys.lists(), search] as const,
  detail: (vhost: string, name: string) =>
    [...queueKeys.all, "detail", vhost, name] as const,
};

export function queueDetailQueryOptions(
  apiClient: ManagementApiClient,
  vhost: string,
  name: string,
  range: ChartRange,
) {
  return queryOptions({
    queryKey: [
      ...queueKeys.detail(vhost, name),
      "lengths",
      range.ageSeconds,
      range.incrementSeconds,
    ] as const,
    queryFn: ({ signal }) =>
      getQueue(
        apiClient,
        vhost,
        name,
        buildRangeQueryParams(range, QUEUE_RANGE_PREFIXES),
        signal,
      ),
    staleTime: PRODUCT_DEFAULTS.polling.nodeDetailsMs,
  });
}

export function useCreateQueueMutation(apiClient: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { vhost: string; name: string; request: CreateQueueRequest }) => {
      await createQueue(apiClient, params.vhost, params.name, params.request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
  });
}

export function useDeleteQueueMutation(apiClient: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { vhost: string; name: string; options?: { ifUnused?: boolean; ifEmpty?: boolean } }) => {
      await deleteQueue(apiClient, params.vhost, params.name, params.options);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
  });
}

export function usePurgeQueueMutation(apiClient: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { vhost: string; name: string }) => {
      await purgeQueue(apiClient, params.vhost, params.name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
  });
}

export function useGetMessagesMutation(apiClient: ManagementApiClient) {
  return useMutation({
    mutationFn: async (params: { vhost: string; name: string; request: GetMessagesRequest }) => {
      return await getMessages(apiClient, params.vhost, params.name, params.request);
    },
  });
}

export function useQueueActionMutation(apiClient: ManagementApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vhost, name, action }: { vhost: string; name: string; action: QueueAction }) =>
      runQueueAction(apiClient, vhost, name, action),
    onSuccess: (_, { vhost, name }) =>
      queryClient.invalidateQueries({ queryKey: queueKeys.detail(vhost, name) }),
  });
}
