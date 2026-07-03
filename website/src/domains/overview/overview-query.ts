import { queryOptions } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { createPollingInterval } from "@/api/polling";
import { capabilityKeys } from "@/capabilities/capability-queries";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { getOverview } from "./overview-api";

export function overviewQueryOptions(
  client: ManagementApiClient,
  isEnabled: () => boolean,
) {
  return queryOptions({
    queryKey: capabilityKeys.overview(),
    queryFn: () => getOverview(client),
    staleTime: PRODUCT_DEFAULTS.polling.overviewMs,
    refetchInterval: createPollingInterval(
      PRODUCT_DEFAULTS.polling.overviewMs,
      isEnabled,
    ),
  });
}
