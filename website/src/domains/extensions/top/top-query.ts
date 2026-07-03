import { queryOptions } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { getEtsTables, getProcess, getTopProcesses } from "./top-api";

export const topKeys = {
  all: ["top"] as const,
  processes: (node: string, rowCount: number) =>
    [...topKeys.all, "processes", node, rowCount] as const,
  ets: (node: string, rowCount: number) =>
    [...topKeys.all, "ets", node, rowCount] as const,
  process: (pid: string) => [...topKeys.all, "process", pid] as const,
};

export function topProcessesQueryOptions(
  client: ManagementApiClient,
  node: string,
  rowCount: number,
) {
  return queryOptions({
    queryKey: topKeys.processes(node, rowCount),
    queryFn: () => getTopProcesses(client, node, rowCount),
    enabled: node.length > 0,
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs),
  });
}

export function etsTablesQueryOptions(
  client: ManagementApiClient,
  node: string,
  rowCount: number,
) {
  return queryOptions({
    queryKey: topKeys.ets(node, rowCount),
    queryFn: () => getEtsTables(client, node, rowCount),
    enabled: node.length > 0,
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs),
  });
}

export function processDetailQueryOptions(
  client: ManagementApiClient,
  pid: string,
) {
  return queryOptions({
    queryKey: topKeys.process(pid),
    queryFn: () => getProcess(client, pid),
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.nodeDetailsMs),
  });
}
