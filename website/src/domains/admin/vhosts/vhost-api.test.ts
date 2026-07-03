import { describe, it, expect, vi, beforeEach } from "vitest";
import { vhostApi } from "./vhost-api";
import { ManagementApiClient } from "@/api/management-api-client";
import { mockVhosts } from "@/test/fixtures/vhosts";

describe("vhostApi", () => {
  let client: ManagementApiClient;

  beforeEach(() => {
    client = {
      request: vi.fn(),
      requestVoid: vi.fn(),
    } as unknown as ManagementApiClient;
  });

  it("getVhosts calls GET /vhosts", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(mockVhosts);
    const result = await vhostApi.getVhosts(client);
    expect(client.request).toHaveBeenCalledWith("/vhosts", expect.any(Object));
    expect(result).toEqual(mockVhosts);
  });

  it("getVhost calls GET /vhosts/:name", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(mockVhosts[0]);
    const result = await vhostApi.getVhost(client, "test-vhost");
    expect(client.request).toHaveBeenCalledWith("/vhosts/test-vhost", expect.any(Object));
    expect(result).toEqual(mockVhosts[0]);
  });

  it("putVhost calls PUT /vhosts/:name with body", async () => {
    await vhostApi.putVhost(client, "new-vhost", { description: "new" });
    expect(client.requestVoid).toHaveBeenCalledWith("/vhosts/new-vhost", {
      method: "PUT",
      body: JSON.stringify({ description: "new" }),
    });
  });

  it("deleteVhost calls DELETE /vhosts/:name", async () => {
    await vhostApi.deleteVhost(client, "old-vhost");
    expect(client.requestVoid).toHaveBeenCalledWith("/vhosts/old-vhost", {
      method: "DELETE",
    });
  });

  it("postVhostStart calls POST to start node", async () => {
    await vhostApi.postVhostStart(client, "test-vhost", "rabbit@node1");
    expect(client.requestVoid).toHaveBeenCalledWith("/vhosts/test-vhost/start/rabbit%40node1", {
      method: "POST",
    });
  });
});
