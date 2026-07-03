import type { ManagementApiClient } from "@/api/management-api-client";
import { apiPath } from "@/api/path";
import { visibleVhostsSchema } from "./capability-schema";

export function getVisibleVhosts(client: ManagementApiClient) {
  return client.request(apiPath("vhosts"), visibleVhostsSchema);
}
