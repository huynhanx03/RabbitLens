import { describe, it, expect, vi, beforeEach } from "vitest";
import { featureFlagApi } from "./feature-flag-api";
import { ManagementApiClient } from "@/api/management-api-client";
import { mockFeatureFlags } from "@/test/fixtures/feature-flags";

describe("featureFlagApi", () => {
  let client: ManagementApiClient;

  beforeEach(() => {
    client = {
      request: vi.fn(),
      requestVoid: vi.fn(),
    } as unknown as ManagementApiClient;
  });

  it("getFeatureFlags calls GET /feature-flags", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(mockFeatureFlags);
    const result = await featureFlagApi.getFeatureFlags(client);
    expect(client.request).toHaveBeenCalledWith("/feature-flags", expect.any(Object));
    expect(result).toEqual(mockFeatureFlags);
  });

  it("enableFeatureFlag calls PUT", async () => {
    await featureFlagApi.enableFeatureFlag(client, "quorum_queue");
    expect(client.requestVoid).toHaveBeenCalledWith(
      "/feature-flags/quorum_queue/enable",
      { method: "PUT" },
    );
  });
});
