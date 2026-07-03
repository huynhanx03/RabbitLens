import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { definitionApi, type DefinitionDocument } from "@/domains/admin/definitions/definition-api";
import { exchangeKeys } from "@/domains/exchanges/exchange-query";
import { queueKeys } from "@/domains/queues/queue-query";
import { vhostKeys } from "@/domains/admin/vhosts/vhost-query";
import { userKeys } from "@/domains/admin/users/user-query";
import { policyKeys } from "@/domains/admin/policies/policy-query";

export function useImportDefinitionsMutation(client: ManagementApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { body: DefinitionDocument; vhost?: string }) =>
      definitionApi.importDefinitions(client, params.body, params.vhost),
    onSuccess: () => {
      // Import can change almost everything, invalidate major lists
      queryClient.invalidateQueries({ queryKey: exchangeKeys.all });
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
      queryClient.invalidateQueries({ queryKey: vhostKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
    },
  });
}
