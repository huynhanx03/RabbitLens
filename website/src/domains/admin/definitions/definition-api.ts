import type { ManagementApiClient } from "@/api/management-api-client";
import * as z from "zod";

const definitionDocumentSchema = z.record(z.string(), z.unknown());
export type DefinitionDocument = z.infer<typeof definitionDocumentSchema>;

export const definitionApi = {
  exportDefinitions: async (client: ManagementApiClient, vhost?: string) => {
    const url = vhost ? `/definitions/${encodeURIComponent(vhost)}` : "/definitions";
    return client.request(url, definitionDocumentSchema);
  },

  importDefinitions: async (client: ManagementApiClient, body: DefinitionDocument, vhost?: string): Promise<void> => {
    const url = vhost ? `/definitions/${encodeURIComponent(vhost)}` : "/definitions";
    await client.requestVoid(url, {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  },
};
