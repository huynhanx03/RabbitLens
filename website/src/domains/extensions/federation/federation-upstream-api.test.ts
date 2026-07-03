import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import {
  deleteFederationUpstream,
  getFederationUpstream,
  getFederationUpstreams,
  putFederationUpstream,
} from "./federation-upstream-api";

describe("federation upstream API", () => {
  let client: ManagementApiClient;

  beforeEach(() => {
    client = {
      request: vi.fn(),
      requestVoid: vi.fn(),
    } as unknown as ManagementApiClient;
  });

  it("reads all upstreams and one encoded upstream", async () => {
    vi.mocked(client.request).mockResolvedValue([]);
    await getFederationUpstreams(client);
    await getFederationUpstream(client, "/", "remote orders");

    expect(client.request).toHaveBeenNthCalledWith(
      1,
      "/parameters/federation-upstream",
      expect.any(Object),
    );
    expect(client.request).toHaveBeenNthCalledWith(
      2,
      "/parameters/federation-upstream/%2F/remote%20orders",
      expect.any(Object),
    );
  });

  it("creates and deletes an upstream without persisting its URI", async () => {
    const value = { uri: "amqps://user:secret@remote/%2f", "max-hops": 2 };
    await putFederationUpstream(client, "/", "remote", value);
    await deleteFederationUpstream(client, "/", "remote");

    expect(client.requestVoid).toHaveBeenNthCalledWith(
      1,
      "/parameters/federation-upstream/%2F/remote",
      { method: "PUT", body: JSON.stringify({ value }) },
    );
    expect(client.requestVoid).toHaveBeenNthCalledWith(
      2,
      "/parameters/federation-upstream/%2F/remote",
      { method: "DELETE" },
    );
  });
});
