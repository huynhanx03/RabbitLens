import { describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import { getNode, getNodeBinaryMemory, getNodes } from "./nodes-api";

function createClient() {
  return {
    request: vi.fn().mockResolvedValue({}),
  } as unknown as ManagementApiClient;
}

describe("nodes API", () => {
  it("uses encoded list and detail paths", async () => {
    const client = createClient();

    await getNodes(client);
    await getNode(client, "rabbit@one/two");
    await getNodeBinaryMemory(client, "rabbit@one/two");

    const request = vi.mocked(client.request);
    expect(request.mock.calls.map(([path]) => path)).toEqual([
      "/nodes",
      "/nodes/rabbit%40one%2Ftwo?memory=true",
      "/nodes/rabbit%40one%2Ftwo?binary=true",
    ]);
  });
});
