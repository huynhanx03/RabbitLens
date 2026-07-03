import { z } from "zod";
import type { ManagementApiClient } from "@/api/management-api-client";
import { apiPath } from "@/api/path";
import { extensionSchema } from "./extension-schema";

export function getExtensions(client: ManagementApiClient) {
  return client.request(apiPath("extensions"), z.array(extensionSchema));
}
