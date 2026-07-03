import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import {
  getClusterName,
  putClusterName,
  resetAllStatistics,
  resetNodeStatistics,
} from "./cluster-api";

describe("cluster API", () => {
  let client: ManagementApiClient;

  beforeEach(() => {
    client = {
      request: vi.fn(),
      requestVoid: vi.fn(),
    } as unknown as ManagementApiClient;
  });

  it("reads and updates the cluster name", async () => {
    vi.mocked(client.request).mockResolvedValue({ name: "rabbit@cluster" });
    await getClusterName(client);
    await putClusterName(client, "production");

    expect(client.request).toHaveBeenCalledWith(
      "/cluster-name",
      expect.any(Object),
    );
    expect(client.requestVoid).toHaveBeenCalledWith("/cluster-name", {
      method: "PUT",
      body: JSON.stringify({ name: "production" }),
    });
  });

  it("resets all or one node statistics using legacy API paths", async () => {
    await resetAllStatistics(client);
    await resetNodeStatistics(client, "rabbit@node-1");

    expect(client.requestVoid).toHaveBeenNthCalledWith(1, "/reset", {
      method: "DELETE",
    });
    expect(client.requestVoid).toHaveBeenNthCalledWith(
      2,
      "/reset/rabbit%40node-1",
      { method: "DELETE" },
    );
  });
});
