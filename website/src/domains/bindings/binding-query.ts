import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import {
  createBinding,
  deleteBinding,
  getQueueBindings,
  type CreateBindingRequest,
} from "./binding-api";

export const bindingKeys = {
  all: ["bindings"] as const,
  exchangeSource: (vhost: string, exchange: string) =>
    [...bindingKeys.all, "exchange-source", vhost, exchange] as const,
  exchangeDestination: (vhost: string, exchange: string) =>
    [...bindingKeys.all, "exchange-destination", vhost, exchange] as const,
  queue: (vhost: string, queue: string) =>
    [...bindingKeys.all, "queue", vhost, queue] as const,
};

export function queueBindingsQueryOptions(
  apiClient: ManagementApiClient,
  vhost: string,
  queue: string,
) {
  return queryOptions({
    queryKey: bindingKeys.queue(vhost, queue),
    queryFn: ({ signal }) => getQueueBindings(apiClient, vhost, queue, signal),
  });
}

export function useCreateBindingMutation(apiClient: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      vhost: string;
      exchange: string;
      destinationType: "q" | "e";
      destination: string;
      request: CreateBindingRequest;
    }) => {
      await createBinding(
        apiClient,
        params.vhost,
        params.exchange,
        params.destinationType,
        params.destination,
        params.request
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bindingKeys.all });
    },
  });
}

export function useDeleteBindingMutation(apiClient: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      vhost: string;
      exchange: string;
      destinationType: "q" | "e";
      destination: string;
      propertiesKey: string;
    }) => {
      await deleteBinding(
        apiClient,
        params.vhost,
        params.exchange,
        params.destinationType,
        params.destination,
        params.propertiesKey
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bindingKeys.all });
    },
  });
}
