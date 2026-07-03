import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { shovelApi } from "./shovel-api";
import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";

export const shovelKeys = {
  all: ["shovels"] as const,
  lists: () => [...shovelKeys.all, "lists"] as const,
  list: (vhost?: string) => [...shovelKeys.lists(), vhost] as const,
};

export function useShovels(client: ManagementApiClient, vhost?: string) {
  const refetchInterval = createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs);
  return useQuery({
    queryKey: shovelKeys.list(vhost),
    queryFn: () => shovelApi.getShovels(client, vhost === "all" ? undefined : vhost),
    refetchInterval,
  });
}

export function useRestartShovelMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { vhost: string; name: string; node: string }) => 
      shovelApi.restartShovel(client, params.vhost, params.name),
    onSuccess: (_, { vhost }) => {
      queryClient.invalidateQueries({ queryKey: shovelKeys.list() });
      queryClient.invalidateQueries({ queryKey: shovelKeys.list(vhost) });
      queryClient.invalidateQueries({ queryKey: shovelKeys.list("all") });
    },
  });
}
