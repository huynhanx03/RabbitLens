import { useQuery } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { featureFlagApi } from "./feature-flag-api";
import { createPollingInterval } from "@/api/polling";

export const featureFlagKeys = {
  all: ["feature-flags"] as const,
  lists: () => [...featureFlagKeys.all, "list"] as const,
  list: () => [...featureFlagKeys.lists()] as const,
};

export function useFeatureFlags(client: ManagementApiClient) {
  const refetchInterval = createPollingInterval(5000);
  return useQuery({
    queryKey: featureFlagKeys.list(),
    queryFn: () => featureFlagApi.getFeatureFlags(client),
    refetchInterval,
  });
}
