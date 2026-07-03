import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import {
  deleteShovel,
  getShovelParameter,
  getShovelParameters,
  putShovelParameter,
  type ShovelValue,
} from "./shovel-parameter-api";

export const shovelParameterKeys = {
  all: ["shovel-parameters"] as const,
  list: () => [...shovelParameterKeys.all, "list"] as const,
  detail: (vhost: string, name: string) =>
    [...shovelParameterKeys.all, "detail", vhost, name] as const,
};

export function shovelParameterListQueryOptions(client: ManagementApiClient) {
  return queryOptions({
    queryKey: shovelParameterKeys.list(),
    queryFn: () => getShovelParameters(client),
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs),
  });
}

export function shovelParameterDetailQueryOptions(
  client: ManagementApiClient,
  vhost: string,
  name: string,
) {
  return queryOptions({
    queryKey: shovelParameterKeys.detail(vhost, name),
    queryFn: () => getShovelParameter(client, vhost, name),
  });
}

type SaveInput = { vhost: string; name: string; value: ShovelValue };

export function useSaveShovel(client: ManagementApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vhost, name, value }: SaveInput) =>
      putShovelParameter(client, vhost, name, value),
    onSuccess: (_, { vhost, name }) => {
      queryClient.invalidateQueries({ queryKey: shovelParameterKeys.list() });
      queryClient.invalidateQueries({
        queryKey: shovelParameterKeys.detail(vhost, name),
      });
    },
  });
}

export function useDeleteShovel(client: ManagementApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vhost, name }: Omit<SaveInput, "value">) =>
      deleteShovel(client, vhost, name),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: shovelParameterKeys.list() }),
  });
}
