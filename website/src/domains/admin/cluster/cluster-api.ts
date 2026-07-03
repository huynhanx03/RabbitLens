import { z } from "zod";
import type { ManagementApiClient } from "@/api/management-api-client";

export const clusterNameSchema = z.object({ name: z.string() }).passthrough();
export type ClusterName = z.infer<typeof clusterNameSchema>;

export function getClusterName(client: ManagementApiClient) {
  return client.request("/cluster-name", clusterNameSchema);
}

export async function putClusterName(
  client: ManagementApiClient,
  name: string,
) {
  await client.requestVoid("/cluster-name", {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export async function resetAllStatistics(client: ManagementApiClient) {
  await client.requestVoid("/reset", { method: "DELETE" });
}

export async function resetNodeStatistics(
  client: ManagementApiClient,
  node: string,
) {
  await client.requestVoid(`/reset/${encodeURIComponent(node)}`, {
    method: "DELETE",
  });
}
