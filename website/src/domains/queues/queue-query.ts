import type { ResourceListSearch } from "@/api/pagination-schema";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { createQueue, deleteQueue, purgeQueue, getMessages, type CreateQueueRequest, type GetMessagesRequest } from "./queue-api";

export const queueKeys = {
  all: ["queues"] as const,
  lists: () => [...queueKeys.all, "list"] as const,
  list: (search: ResourceListSearch) =>
    [...queueKeys.lists(), search] as const,
  detail: (vhost: string, name: string) =>
    [...queueKeys.all, "detail", vhost, name] as const,
};

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
