import { describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import { getExtensions } from "./extension-api";

describe("extension API", () => {
  it("loads extensions from the exact endpoint", async () => {
    const client = {
      request: vi.fn().mockResolvedValue([]),
    } as unknown as ManagementApiClient;

    await getExtensions(client);

    expect(client.request).toHaveBeenCalledWith(
      "/extensions",
      expect.anything(),
    );
  });
});
