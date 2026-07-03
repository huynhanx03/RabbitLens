import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { vhostApi } from "@/domains/admin/vhosts/vhost-api";
import { type VhostBody } from "@/domains/admin/vhosts/vhost-schema";
import { vhostKeys } from "@/domains/admin/vhosts/vhost-query";

export function useCreateVhostMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { name: string; body: VhostBody }) =>
      vhostApi.putVhost(client, params.name, params.body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vhostKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vhostKeys.detail(variables.name) });
    },
  });
}

export function useDeleteVhostMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => vhostApi.deleteVhost(client, name),
    onSuccess: () => {
      // Deleting a vhost can affect many resources (queues, exchanges, etc.), so invalidate broadly
      queryClient.invalidateQueries(); 
    },
  });
}

export function useToggleVhostProtectionMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { name: string; enable: boolean }) =>
      params.enable
        ? vhostApi.putVhostDeletionProtection(client, params.name)
        : vhostApi.deleteVhostDeletionProtection(client, params.name),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vhostKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vhostKeys.detail(variables.name) });
    },
  });
}

export function useRestartVhostMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { vhost: string; node: string }) =>
      vhostApi.postVhostStart(client, params.vhost, params.node),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vhostKeys.detail(variables.vhost) });
      queryClient.invalidateQueries({ queryKey: ["overview"] }); // Invalidate overview roughly
    },
  });
}
