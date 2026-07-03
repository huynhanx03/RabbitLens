import type { ManagementApiClient } from "@/api/management-api-client";
import { deprecatedFeatureSchema, type DeprecatedFeatureResponse } from "./deprecated-feature-schema";
import * as z from "zod";
import { ApiError } from "@/api/api-error";

export const deprecatedFeatureApi = {
  getDeprecatedFeatures: async (client: ManagementApiClient): Promise<DeprecatedFeatureResponse[]> => {
    try {
      return await client.request("/deprecated-features", z.array(deprecatedFeatureSchema));
    } catch (error: unknown) {
      // Return empty if the endpoint doesn't exist (older rabbitmq versions)
      if (error instanceof ApiError && error.status === 404) {
        return [];
      }
      throw error;
    }
  },
};
