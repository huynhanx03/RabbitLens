import type { ManagementApiClient } from "@/api/management-api-client";
import { shovelStatusSchema, type ShovelStatusResponse } from "./shovel-schema";
import { z } from "zod";

export const shovelApi = {
  getShovels: async (client: ManagementApiClient, vhost?: string): Promise<ShovelStatusResponse[]> => {
    const url = vhost ? `/shovels/${encodeURIComponent(vhost)}` : "/shovels";
    return client.request(url, z.array(shovelStatusSchema));
  },

  restartShovel: async (client: ManagementApiClient, vhost: string, name: string): Promise<void> => {
    const url = `/shovels/vhost/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}/restart`;
    await client.requestVoid(url, {
      method: "DELETE",
    });
  },
};
