import { useQuery } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { policyApi } from "./policy-api";
import { createPollingInterval } from "@/api/polling";

export const policyKeys = {
  all: ["policies"] as const,
  lists: () => [...policyKeys.all, "list"] as const,
  list: () => [...policyKeys.lists()] as const,
  details: () => [...policyKeys.all, "detail"] as const,
  detail: (vhost: string, name: string) => [...policyKeys.details(), vhost, name] as const,
  operatorAll: ["operator-policies"] as const,
  operatorLists: () => [...policyKeys.operatorAll, "list"] as const,
  operatorList: () => [...policyKeys.operatorLists()] as const,
  operatorDetails: () => [...policyKeys.operatorAll, "detail"] as const,
  operatorDetail: (vhost: string, name: string) => [...policyKeys.operatorDetails(), vhost, name] as const,
};

export function usePolicies(client: ManagementApiClient) {
  const refetchInterval = createPollingInterval(5000);
  return useQuery({
    queryKey: policyKeys.list(),
    queryFn: () => policyApi.getPolicies(client),
    refetchInterval,
  });
}

export function usePolicy(client: ManagementApiClient, vhost: string, name: string) {
  const refetchInterval = createPollingInterval(5000);
  return useQuery({
    queryKey: policyKeys.detail(vhost, name),
    queryFn: () => policyApi.getPolicy(client, vhost, name),
    refetchInterval,
  });
}

export function useOperatorPolicies(client: ManagementApiClient) {
  const refetchInterval = createPollingInterval(5000);
  return useQuery({
    queryKey: policyKeys.operatorList(),
    queryFn: () => policyApi.getOperatorPolicies(client),
    refetchInterval,
  });
}

export function useOperatorPolicy(client: ManagementApiClient, vhost: string, name: string) {
  const refetchInterval = createPollingInterval(5000);
  return useQuery({
    queryKey: policyKeys.operatorDetail(vhost, name),
    queryFn: () => policyApi.getOperatorPolicy(client, vhost, name),
    refetchInterval,
  });
}
