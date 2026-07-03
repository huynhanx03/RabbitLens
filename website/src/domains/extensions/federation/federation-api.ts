import type { ManagementApiClient } from "@/api/management-api-client";
import { federationLinkSchema, type FederationLinkResponse } from "./federation-schema";
import { z } from "zod";

export const federationApi = {
  getFederationLinks: async (client: ManagementApiClient, vhost?: string): Promise<FederationLinkResponse[]> => {
    const url = vhost ? `/federation-links/${encodeURIComponent(vhost)}` : "/federation-links";
    return client.request(url, z.array(federationLinkSchema));
  },

  restartFederationLink: async (client: ManagementApiClient, vhost: string, id: string, node: string): Promise<void> => {
    const url = `/federation-links/vhost/${encodeURIComponent(vhost)}/${encodeURIComponent(id)}/${encodeURIComponent(node)}/restart`;
    await client.requestVoid(url, {
      method: "DELETE",
    });
  },
};
