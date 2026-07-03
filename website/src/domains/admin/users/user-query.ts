import { useQuery } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { userApi } from "./user-api";
import { createPollingInterval } from "@/api/polling";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: () => [...userKeys.lists()] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (name: string) => [...userKeys.details(), name] as const,
  permissions: (name: string) => [...userKeys.detail(name), "permissions"] as const,
  topicPermissions: (name: string) => [...userKeys.detail(name), "topic-permissions"] as const,
};

export function useUsers(client: ManagementApiClient, enabled = true) {
  const refetchInterval = createPollingInterval(5000);
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: () => userApi.getUsers(client),
    refetchInterval,
    enabled,
  });
}

export function useUser(client: ManagementApiClient, name: string) {
  const refetchInterval = createPollingInterval(5000);
  return useQuery({
    queryKey: userKeys.detail(name),
    queryFn: () => userApi.getUser(client, name),
    refetchInterval,
  });
}

export function useUserPermissions(client: ManagementApiClient, name: string) {
  const refetchInterval = createPollingInterval(10000);
  return useQuery({
    queryKey: userKeys.permissions(name),
    queryFn: () => userApi.getUserPermissions(client, name),
    refetchInterval,
  });
}

export function useUserTopicPermissions(client: ManagementApiClient, name: string) {
  const refetchInterval = createPollingInterval(10000);
  return useQuery({
    queryKey: userKeys.topicPermissions(name),
    queryFn: () => userApi.getUserTopicPermissions(client, name),
    refetchInterval,
  });
}
