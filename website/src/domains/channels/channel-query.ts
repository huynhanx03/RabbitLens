import type { ResourceListSearch } from "@/api/pagination-schema";
import { connectionKeys } from "@/domains/connections/connection-query";
import { queryOptions } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { getChannel, getChannels } from "./channel-api";

export const channelKeys = {
  all: ["channels"] as const,
  lists: () => [...channelKeys.all, "list"] as const,
  list: (search: ResourceListSearch) =>
    [...channelKeys.lists(), search] as const,
  detail: (name: string) => [...channelKeys.all, "detail", name] as const,
  
  // Extension of connectionKeys for its children
  connectionChannels: (connectionName: string, search: ResourceListSearch) =>
    [...connectionKeys.detail(connectionName), "channels", search] as const,
};

export function channelListQueryOptions(
  client: ManagementApiClient,
  search: ResourceListSearch,
) {
  return queryOptions({
    queryKey: channelKeys.list(search),
    queryFn: ({ signal }) => getChannels(client, search, signal),
    staleTime: PRODUCT_DEFAULTS.polling.heavyListsMs,
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs),
  });
}

export function channelDetailQueryOptions(
  client: ManagementApiClient,
  name: string,
  rangeKey: unknown,
  rangeParams?: URLSearchParams,
) {
  return queryOptions({
    queryKey: [...channelKeys.detail(name), rangeKey],
    queryFn: ({ signal }) => getChannel(client, name, rangeParams, signal),
    staleTime: PRODUCT_DEFAULTS.polling.nodeDetailsMs,
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.nodeDetailsMs),
  });
}
