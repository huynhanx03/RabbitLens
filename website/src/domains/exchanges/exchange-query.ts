import type { ResourceListSearch } from "@/api/pagination-schema";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { createExchange, deleteExchange, publishMessage, type CreateExchangeRequest, type PublishMessageRequest } from "./exchange-api";

export const exchangeKeys = {
  all: ["exchanges"] as const,
  lists: () => [...exchangeKeys.all, "list"] as const,
  list: (search: ResourceListSearch) =>
    [...exchangeKeys.lists(), search] as const,
  detail: (vhost: string, name: string) =>
    [...exchangeKeys.all, "detail", vhost, name] as const,
};

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
