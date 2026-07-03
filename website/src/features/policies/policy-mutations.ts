import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { policyApi } from "@/domains/admin/policies/policy-api";
import { type PolicyBody } from "@/domains/admin/policies/policy-schema";
import { policyKeys } from "@/domains/admin/policies/policy-query";

export function useCreatePolicyMutation(client: ManagementApiClient, isOperator: boolean = false) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { vhost: string; name: string; body: PolicyBody }) => {
      if (isOperator) {
        return policyApi.putOperatorPolicy(client, params.vhost, params.name, params.body);
      }
      return policyApi.putPolicy(client, params.vhost, params.name, params.body);
    },
    onSuccess: (_, variables) => {
      if (isOperator) {
        queryClient.invalidateQueries({ queryKey: policyKeys.operatorLists() });
        queryClient.invalidateQueries({ queryKey: policyKeys.operatorDetail(variables.vhost, variables.name) });
      } else {
        queryClient.invalidateQueries({ queryKey: policyKeys.lists() });
        queryClient.invalidateQueries({ queryKey: policyKeys.detail(variables.vhost, variables.name) });
      }
    },
  });
}

export function useDeletePolicyMutation(client: ManagementApiClient, isOperator: boolean = false) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { vhost: string; name: string }) => {
      if (isOperator) {
        return policyApi.deleteOperatorPolicy(client, params.vhost, params.name);
      }
      return policyApi.deletePolicy(client, params.vhost, params.name);
    },
    onSuccess: () => {
      if (isOperator) {
        queryClient.invalidateQueries({ queryKey: policyKeys.operatorLists() });
      } else {
        queryClient.invalidateQueries({ queryKey: policyKeys.lists() });
      }
    },
  });
}
