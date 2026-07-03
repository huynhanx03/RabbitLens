import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { federationApi } from "./federation-api";
import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";

export const federationKeys = {
  all: ["federation"] as const,
  links: () => [...federationKeys.all, "links"] as const,
  linkList: (vhost?: string) => [...federationKeys.links(), vhost] as const,
};

export function useFederationLinks(client: ManagementApiClient, vhost?: string) {
  const refetchInterval = createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs);
  return useQuery({
    queryKey: federationKeys.linkList(vhost),
    queryFn: () => federationApi.getFederationLinks(client, vhost === "all" ? undefined : vhost),
    refetchInterval,
  });
}

export function useRestartFederationLinkMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { vhost: string; id: string; node: string }) => 
      federationApi.restartFederationLink(client, params.vhost, params.id, params.node),
    onSuccess: (_, { vhost }) => {
      queryClient.invalidateQueries({ queryKey: federationKeys.linkList() });
      queryClient.invalidateQueries({ queryKey: federationKeys.linkList(vhost) });
      queryClient.invalidateQueries({ queryKey: federationKeys.linkList("all") });
    },
  });
}
