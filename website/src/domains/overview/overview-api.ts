import type { ManagementApiClient } from "@/api/management-api-client";
import { apiPath } from "@/api/path";
import { overviewSchema } from "./overview-schema";

export function getOverview(client: ManagementApiClient) {
  return client.request(apiPath("overview"), overviewSchema);
}
