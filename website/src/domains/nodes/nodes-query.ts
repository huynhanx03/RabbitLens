import { queryOptions } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { getNode, getNodeBinaryMemory, getNodes } from "./nodes-api";

export const nodesKeys = {
  all: ["nodes"] as const,
  lists: () => [...nodesKeys.all, "list"] as const,
  list: () => nodesKeys.lists(),
  details: () => [...nodesKeys.all, "detail"] as const,
  detail: (name: string) => [...nodesKeys.details(), name] as const,
  binary: (name: string) => [...nodesKeys.detail(name), "binary"] as const,
};

export function nodesListQueryOptions(
  client: ManagementApiClient,
  isEnabled: () => boolean,
) {
  return queryOptions({
    queryKey: nodesKeys.list(),
    queryFn: () => getNodes(client),
    refetchInterval: createPollingInterval(
      PRODUCT_DEFAULTS.polling.heavyListsMs,
      isEnabled,
    ),
  });
}

export function nodeDetailQueryOptions(
  client: ManagementApiClient,
  name: string,
  isEnabled: () => boolean,
) {
  return queryOptions({
    queryKey: nodesKeys.detail(name),
    queryFn: () => getNode(client, name),
    refetchInterval: createPollingInterval(
      PRODUCT_DEFAULTS.polling.nodeDetailsMs,
      isEnabled,
    ),
  });
}

export function nodeBinaryQueryOptions(
  client: ManagementApiClient,
  name: string,
  enabled: boolean,
) {
  return queryOptions({
    queryKey: nodesKeys.binary(name),
    queryFn: () => getNodeBinaryMemory(client, name),
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
