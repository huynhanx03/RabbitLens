import { useQuery } from "@tanstack/react-query";
import { type ManagementApiClient } from "./management-api-client";
import { nodesSchema, nodeSchema } from "./nodes-schema";

export function useNodes(client: ManagementApiClient) {
  return useQuery({
    queryKey: ["nodes"],
    queryFn: async () => {
      return await client.request("/nodes", nodesSchema);
    },
    staleTime: 5000,
    refetchInterval: 5000,
  });
}

export function useNode(client: ManagementApiClient, name: string) {
  return useQuery({
    queryKey: ["nodes", name],
    queryFn: async () => {
      // The API expects URL encoded node name
      return await client.request(`/nodes/${encodeURIComponent(name)}`, nodeSchema);
    },
    staleTime: 5000,
    refetchInterval: 5000,
  });
}
