import { useQuery } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { vhostApi } from "./vhost-api";
import { createPollingInterval } from "@/api/polling";

export const vhostKeys = {
  all: ["vhosts"] as const,
  lists: () => [...vhostKeys.all, "list"] as const,
  list: () => [...vhostKeys.lists()] as const,
  details: () => [...vhostKeys.all, "detail"] as const,
  detail: (name: string) => [...vhostKeys.details(), name] as const,
};

export function useVhosts(client: ManagementApiClient) {
  const refetchInterval = createPollingInterval(5000);
  return useQuery({
    queryKey: vhostKeys.list(),
    queryFn: () => vhostApi.getVhosts(client),
    refetchInterval,
  });
}

export function useVhost(client: ManagementApiClient, name: string) {
  const refetchInterval = createPollingInterval(5000);
  return useQuery({
    queryKey: vhostKeys.detail(name),
    queryFn: () => vhostApi.getVhost(client, name),
    refetchInterval,
  });
}
