import { queryOptions } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { getVisibleVhosts } from "./capability-api";

export const capabilityKeys = {
  all: ["capabilities"] as const,
  overview: () => [...capabilityKeys.all, "overview"] as const,
  extensions: () => [...capabilityKeys.all, "extensions"] as const,
  vhosts: () => [...capabilityKeys.all, "vhosts"] as const,
};

export function visibleVhostsQueryOptions(client: ManagementApiClient) {
  return queryOptions({
    queryKey: capabilityKeys.vhosts(),
    queryFn: () => getVisibleVhosts(client),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
