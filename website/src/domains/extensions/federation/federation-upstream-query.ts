import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import {
  deleteFederationUpstream,
  getFederationUpstream,
  getFederationUpstreams,
  putFederationUpstream,
  type FederationUpstreamValue,
} from "./federation-upstream-api";

export const federationUpstreamKeys = {
  all: ["federation-upstreams"] as const,
  list: () => [...federationUpstreamKeys.all, "list"] as const,
  detail: (vhost: string, name: string) =>
    [...federationUpstreamKeys.all, "detail", vhost, name] as const,
};

export function federationUpstreamListQueryOptions(client: ManagementApiClient) {
  return queryOptions({
    queryKey: federationUpstreamKeys.list(),
    queryFn: () => getFederationUpstreams(client),
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs),
  });
}

export function federationUpstreamDetailQueryOptions(
  client: ManagementApiClient,
  vhost: string,
  name: string,
) {
  return queryOptions({
    queryKey: federationUpstreamKeys.detail(vhost, name),
    queryFn: () => getFederationUpstream(client, vhost, name),
  });
}

type SaveInput = {
  vhost: string;
  name: string;
  value: FederationUpstreamValue;
};

export function useSaveFederationUpstream(client: ManagementApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vhost, name, value }: SaveInput) =>
      putFederationUpstream(client, vhost, name, value),
    onSuccess: (_, { vhost, name }) => {
      queryClient.invalidateQueries({ queryKey: federationUpstreamKeys.list() });
      queryClient.invalidateQueries({
        queryKey: federationUpstreamKeys.detail(vhost, name),
      });
    },
  });
}

export function useDeleteFederationUpstream(client: ManagementApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vhost, name }: Omit<SaveInput, "value">) =>
      deleteFederationUpstream(client, vhost, name),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: federationUpstreamKeys.list() }),
  });
}
