import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import type { ResourceListSearch } from "@/api/pagination-schema";
import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import {
  createSuperStream,
  getStreamConnection,
  getStreamConnectionConsumers,
  getStreamConnectionPublishers,
  getStreamConnections,
  type SuperStreamBody,
} from "./stream-api";

export const streamKeys = {
  all: ["stream-management"] as const,
  list: (search: ResourceListSearch) => [...streamKeys.all, "list", search] as const,
  detail: (vhost: string, name: string) => [...streamKeys.all, "detail", vhost, name] as const,
  publishers: (vhost: string, name: string) => [...streamKeys.detail(vhost, name), "publishers"] as const,
  consumers: (vhost: string, name: string) => [...streamKeys.detail(vhost, name), "consumers"] as const,
};

export function streamConnectionListQueryOptions(
  client: ManagementApiClient,
  search: ResourceListSearch,
) {
  return queryOptions({
    queryKey: streamKeys.list(search),
    queryFn: ({ signal }) => getStreamConnections(client, search, signal),
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs),
  });
}

export function streamConnectionDetailQueryOptions(
  client: ManagementApiClient,
  vhost: string,
  name: string,
) {
  return queryOptions({
    queryKey: streamKeys.detail(vhost, name),
    queryFn: () => getStreamConnection(client, vhost, name),
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.nodeDetailsMs),
  });
}

export function streamPublisherQueryOptions(client: ManagementApiClient, vhost: string, name: string) {
  return queryOptions({ queryKey: streamKeys.publishers(vhost, name), queryFn: () => getStreamConnectionPublishers(client, vhost, name) });
}

export function streamConsumerQueryOptions(client: ManagementApiClient, vhost: string, name: string) {
  return queryOptions({ queryKey: streamKeys.consumers(vhost, name), queryFn: () => getStreamConnectionConsumers(client, vhost, name) });
}

export function useCreateSuperStream(client: ManagementApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vhost, name, body }: { vhost: string; name: string; body: SuperStreamBody }) => createSuperStream(client, vhost, name, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["queues"] }),
  });
}
