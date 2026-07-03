import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import {
  deleteUserLimit,
  deleteVhostLimit,
  getUserLimits,
  getVhostLimits,
  putUserLimit,
  putVhostLimit,
} from "./limit-api";
import type { LimitScope } from "./limit-schema";

export const limitKeys = {
  all: ["limits"] as const,
  list: (scope: LimitScope) => [...limitKeys.all, scope] as const,
};

export function vhostLimitsQueryOptions(client: ManagementApiClient) {
  return queryOptions({
    queryKey: limitKeys.list("vhost"),
    queryFn: () => getVhostLimits(client),
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs),
  });
}

export function userLimitsQueryOptions(client: ManagementApiClient) {
  return queryOptions({
    queryKey: limitKeys.list("user"),
    queryFn: () => getUserLimits(client),
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs),
  });
}

type SetLimitInput = {
  scope: LimitScope;
  owner: string;
  name: string;
  value: number;
};

type ClearLimitInput = Omit<SetLimitInput, "value">;

export function useSetLimitMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scope, owner, name, value }: SetLimitInput) =>
      scope === "vhost"
        ? putVhostLimit(client, owner, name, value)
        : putUserLimit(client, owner, name, value),
    onSuccess: (_, { scope }) =>
      queryClient.invalidateQueries({ queryKey: limitKeys.list(scope) }),
  });
}

export function useClearLimitMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scope, owner, name }: ClearLimitInput) =>
      scope === "vhost"
        ? deleteVhostLimit(client, owner, name)
        : deleteUserLimit(client, owner, name),
    onSuccess: (_, { scope }) =>
      queryClient.invalidateQueries({ queryKey: limitKeys.list(scope) }),
  });
}
