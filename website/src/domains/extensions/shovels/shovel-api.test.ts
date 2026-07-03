import { describe, it, expect, vi, beforeEach } from "vitest";
import { shovelApi } from "./shovel-api";
import { ManagementApiClient } from "@/api/management-api-client";
import { mockShovels } from "@/test/fixtures/extensions/shovels";

describe("shovelApi", () => {
  let client: ManagementApiClient;

  beforeEach(() => {
    client = {
      request: vi.fn(),
      requestVoid: vi.fn(),
    } as unknown as ManagementApiClient;
  });

  it("getShovels calls GET /shovels", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(mockShovels);
    const result = await shovelApi.getShovels(client);
    expect(client.request).toHaveBeenCalledWith("/shovels", expect.any(Object));
    expect(result).toEqual(mockShovels);
  });

  it("getShovels with vhost calls GET /shovels/vhost", async () => {
    vi.mocked(client.request).mockResolvedValueOnce([mockShovels[1]]);
    const result = await shovelApi.getShovels(client, "test-vhost");
    expect(client.request).toHaveBeenCalledWith("/shovels/test-vhost", expect.any(Object));
    expect(result).toEqual([mockShovels[1]]);
  });

  it("restartShovel calls DELETE", async () => {
    await shovelApi.restartShovel(client, "my-vhost", "shovel-name");
    expect(client.requestVoid).toHaveBeenCalledWith("/shovels/vhost/my-vhost/shovel-name/restart", {
      method: "DELETE",
    });
  });
});
