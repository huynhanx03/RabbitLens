import { describe, it, expect, vi, beforeEach } from "vitest";
import { federationApi } from "./federation-api";
import { ManagementApiClient } from "@/api/management-api-client";
import { mockFederationLinks } from "@/test/fixtures/extensions/federation";

describe("federationApi", () => {
  let client: ManagementApiClient;

  beforeEach(() => {
    client = {
      request: vi.fn(),
      requestVoid: vi.fn(),
    } as unknown as ManagementApiClient;
  });

  it("getFederationLinks calls GET /federation-links", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(mockFederationLinks);
    const result = await federationApi.getFederationLinks(client);
    expect(client.request).toHaveBeenCalledWith("/federation-links", expect.any(Object));
    expect(result).toEqual(mockFederationLinks);
  });

  it("getFederationLinks with vhost calls GET /federation-links/vhost", async () => {
    vi.mocked(client.request).mockResolvedValueOnce([mockFederationLinks[1]]);
    const result = await federationApi.getFederationLinks(client, "test-vhost");
    expect(client.request).toHaveBeenCalledWith("/federation-links/test-vhost", expect.any(Object));
    expect(result).toEqual([mockFederationLinks[1]]);
  });

  it("restartFederationLink calls DELETE", async () => {
    await federationApi.restartFederationLink(client, "my-vhost", "link-id", "rabbit@node1");
    expect(client.requestVoid).toHaveBeenCalledWith("/federation-links/vhost/my-vhost/link-id/rabbit%40node1/restart", {
      method: "DELETE",
    });
  });
});
