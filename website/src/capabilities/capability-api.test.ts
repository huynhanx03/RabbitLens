import { describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import { getVisibleVhosts } from "./capability-api";

describe("capability API", () => {
  it("loads visible virtual hosts from the exact endpoint", async () => {
    const client = {
      request: vi.fn().mockResolvedValue([]),
    } as unknown as ManagementApiClient;

    await getVisibleVhosts(client);

    expect(vi.mocked(client.request).mock.calls.map(([path]) => path)).toEqual([
      "/vhosts",
    ]);
  });
});
