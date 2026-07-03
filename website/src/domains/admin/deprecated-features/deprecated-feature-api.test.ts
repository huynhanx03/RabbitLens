import { describe, it, expect, vi, beforeEach } from "vitest";
import { deprecatedFeatureApi } from "./deprecated-feature-api";
import { ApiError } from "@/api/api-error";
import { ManagementApiClient } from "@/api/management-api-client";
import { mockDeprecatedFeatures } from "@/test/fixtures/feature-flags";

describe("deprecatedFeatureApi", () => {
  let client: ManagementApiClient;

  beforeEach(() => {
    client = {
      request: vi.fn(),
    } as unknown as ManagementApiClient;
  });

  it("getDeprecatedFeatures calls GET /deprecated-features", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(mockDeprecatedFeatures);
    const result = await deprecatedFeatureApi.getDeprecatedFeatures(client);
    expect(client.request).toHaveBeenCalledWith("/deprecated-features", expect.any(Object));
    expect(result).toEqual(mockDeprecatedFeatures);
  });

  it("getDeprecatedFeatures handles 404 gracefully", async () => {
    vi.mocked(client.request).mockRejectedValueOnce(
      new ApiError("not-found", 404, false, "Resource not found"),
    );
    const result = await deprecatedFeatureApi.getDeprecatedFeatures(client);
    expect(result).toEqual([]);
  });
});
