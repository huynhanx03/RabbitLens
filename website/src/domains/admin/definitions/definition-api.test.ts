import { describe, it, expect, vi, beforeEach } from "vitest";
import { definitionApi } from "./definition-api";
import { ManagementApiClient } from "@/api/management-api-client";

describe("definitionApi", () => {
  let client: ManagementApiClient;

  beforeEach(() => {
    client = {
      request: vi.fn(),
      requestVoid: vi.fn(),
    } as unknown as ManagementApiClient;
  });

  it("exportDefinitions calls GET /definitions", async () => {
    vi.mocked(client.request).mockResolvedValueOnce({ rabbit_version: "3.13.0" });
    const result = await definitionApi.exportDefinitions(client);
    expect(client.request).toHaveBeenCalledWith("/definitions", expect.any(Object));
    expect(result).toEqual({ rabbit_version: "3.13.0" });
  });

  it("exportDefinitions with vhost calls GET /definitions/vhost", async () => {
    vi.mocked(client.request).mockResolvedValueOnce({ rabbit_version: "3.13.0" });
    const result = await definitionApi.exportDefinitions(client, "test-vhost");
    expect(client.request).toHaveBeenCalledWith("/definitions/test-vhost", expect.any(Object));
    expect(result).toEqual({ rabbit_version: "3.13.0" });
  });

  it("importDefinitions calls POST /definitions", async () => {
    await definitionApi.importDefinitions(client, { rabbit_version: "3.13.0" });
    expect(client.requestVoid).toHaveBeenCalledWith("/definitions", {
      method: "POST",
      body: JSON.stringify({ rabbit_version: "3.13.0" }),
    });
  });

  it("importDefinitions with vhost calls POST /definitions/vhost", async () => {
    await definitionApi.importDefinitions(client, { rabbit_version: "3.13.0" }, "test-vhost");
    expect(client.requestVoid).toHaveBeenCalledWith("/definitions/test-vhost", {
      method: "POST",
      body: JSON.stringify({ rabbit_version: "3.13.0" }),
    });
  });
});
