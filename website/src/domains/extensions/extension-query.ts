import { queryOptions } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { capabilityKeys } from "@/capabilities/capability-queries";
import { getExtensions } from "./extension-api";

export function extensionsQueryOptions(client: ManagementApiClient) {
  return queryOptions({
    queryKey: capabilityKeys.extensions(),
    queryFn: () => getExtensions(client),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
