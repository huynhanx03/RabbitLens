import type { ManagementApiClient } from "@/api/management-api-client";
import { featureFlagSchema, type FeatureFlagResponse } from "./feature-flag-schema";
import * as z from "zod";

export const featureFlagApi = {
  getFeatureFlags: async (client: ManagementApiClient): Promise<FeatureFlagResponse[]> => {
    return client.request("/feature-flags", z.array(featureFlagSchema));
  },

  enableFeatureFlag: async (client: ManagementApiClient, name: string): Promise<void> => {
    await client.requestVoid(`/feature-flags/${encodeURIComponent(name)}/enable`, {
      method: "PUT",
    });
  },
};
