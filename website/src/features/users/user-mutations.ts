import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { userApi } from "@/domains/admin/users/user-api";
import { type UserBody, type PermissionBody, type TopicPermissionBody } from "@/domains/admin/users/user-schema";
import { userKeys } from "@/domains/admin/users/user-query";

export function useCreateUserMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { name: string; body: UserBody }) =>
      userApi.putUser(client, params.name, params.body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.name) });
    },
  });
}

export function useDeleteUserMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => userApi.deleteUser(client, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useSetPermissionMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { user: string; vhost: string; body: PermissionBody }) =>
      userApi.putUserPermission(client, params.user, params.vhost, params.body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.permissions(variables.user) });
    },
  });
}

export function useClearPermissionMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { user: string; vhost: string }) =>
      userApi.deleteUserPermission(client, params.user, params.vhost),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.permissions(variables.user) });
    },
  });
}

export function useSetTopicPermissionMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { user: string; vhost: string; body: TopicPermissionBody }) =>
      userApi.putUserTopicPermission(client, params.user, params.vhost, params.body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.topicPermissions(variables.user) });
    },
  });
}

export function useClearTopicPermissionMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { user: string; vhost: string; exchange: string }) =>
      userApi.deleteUserTopicPermission(client, params.user, params.vhost, params.exchange),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.topicPermissions(variables.user) });
    },
  });
}
