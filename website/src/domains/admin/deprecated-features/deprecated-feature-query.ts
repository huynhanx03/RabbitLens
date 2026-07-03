import { useQuery } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { deprecatedFeatureApi } from "./deprecated-feature-api";
import { createPollingInterval } from "@/api/polling";

export const deprecatedFeatureKeys = {
  all: ["deprecated-features"] as const,
  lists: () => [...deprecatedFeatureKeys.all, "list"] as const,
  list: () => [...deprecatedFeatureKeys.lists()] as const,
};

export function useDeprecatedFeatures(client: ManagementApiClient) {
  const refetchInterval = createPollingInterval(5000);
  return useQuery({
    queryKey: deprecatedFeatureKeys.list(),
    queryFn: () => deprecatedFeatureApi.getDeprecatedFeatures(client),
    refetchInterval,
  });
}
