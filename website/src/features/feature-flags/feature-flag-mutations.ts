import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { featureFlagApi } from "@/domains/admin/feature-flags/feature-flag-api";
import { featureFlagKeys } from "@/domains/admin/feature-flags/feature-flag-query";

export function useEnableFeatureFlagMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => featureFlagApi.enableFeatureFlag(client, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: featureFlagKeys.lists() });
    },
  });
}
