import { describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import { getOverview } from "./overview-api";

describe("overview API", () => {
  it("loads the shared overview endpoint", async () => {
    const client = {
      request: vi.fn().mockResolvedValue({}),
    } as unknown as ManagementApiClient;

    await getOverview(client);

    expect(client.request).toHaveBeenCalledWith(
      "/overview",
      expect.anything(),
    );
  });
});
