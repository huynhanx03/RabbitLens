import type { ManagementApiClient } from "@/api/management-api-client";
import { vhostSchema, type VhostBody, type VhostResponse } from "./vhost-schema";
import * as z from "zod";

export const vhostApi = {
  getVhosts: async (client: ManagementApiClient): Promise<VhostResponse[]> => {
    return client.request("/vhosts", z.array(vhostSchema));
  },

  getVhost: async (client: ManagementApiClient, name: string): Promise<VhostResponse> => {
    return client.request(`/vhosts/${encodeURIComponent(name)}`, vhostSchema);
  },

  putVhost: async (
    client: ManagementApiClient,
    name: string,
    body: VhostBody
  ): Promise<void> => {
    await client.requestVoid(`/vhosts/${encodeURIComponent(name)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  deleteVhost: async (client: ManagementApiClient, name: string): Promise<void> => {
    await client.requestVoid(`/vhosts/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
  },

  putVhostDeletionProtection: async (
    client: ManagementApiClient,
    name: string
  ): Promise<void> => {
    // API endpoint: /api/vhosts/:vhost/deletion/protection (assuming body not needed or empty)
    await client.requestVoid(`/vhosts/${encodeURIComponent(name)}/deletion/protection`, {
      method: "PUT",
    });
  },

  deleteVhostDeletionProtection: async (
    client: ManagementApiClient,
    name: string
  ): Promise<void> => {
    await client.requestVoid(`/vhosts/${encodeURIComponent(name)}/deletion/protection`, {
      method: "DELETE",
    });
  },

  postVhostStart: async (
    client: ManagementApiClient,
    vhost: string,
    node: string
  ): Promise<void> => {
    await client.requestVoid(`/vhosts/${encodeURIComponent(vhost)}/start/${encodeURIComponent(node)}`, {
      method: "POST",
    });
  },
};
