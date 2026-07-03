import type { ManagementApiClient } from "@/api/management-api-client";
import { nodeSchema, nodesSchema } from "@/api/nodes-schema";
import { apiPath } from "@/api/path";

export function getNodes(client: ManagementApiClient) {
  return client.request(apiPath("nodes"), nodesSchema);
}

export function getNode(client: ManagementApiClient, name: string) {
  return client.request(`${apiPath("nodes", name)}?memory=true`, nodeSchema);
}

export function getNodeBinaryMemory(
  client: ManagementApiClient,
  name: string,
) {
  return client.request(`${apiPath("nodes", name)}?binary=true`, nodeSchema);
}
