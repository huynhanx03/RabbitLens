import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import {
  createSuperStream,
  getStreamConnection,
  getStreamConnectionConsumers,
  getStreamConnectionPublishers,
  getStreamConnections,
} from "./stream-api";

describe("stream management API", () => {
  let client: ManagementApiClient;

  beforeEach(() => {
    client = {
      request: vi.fn(),
      requestVoid: vi.fn(),
    } as unknown as ManagementApiClient;
  });

  it("requests the paginated stream connection collection", async () => {
    vi.mocked(client.request).mockResolvedValue({ items: [] });
    await getStreamConnections(client, {
      page: 2,
      pageSize: 50,
      name: "worker",
      useRegex: false,
      sortReverse: false,
    });

    expect(client.request).toHaveBeenCalledWith(
      expect.stringMatching(/^\/stream\/connections\?/),
      expect.any(Object),
      expect.any(Object),
    );
    expect(vi.mocked(client.request).mock.calls[0][0]).toContain("page=2");
  });

  it("reads detail publishers and consumers from encoded paths", async () => {
    vi.mocked(client.request).mockResolvedValue({});
    await getStreamConnection(client, "/", "client 1");
    await getStreamConnectionPublishers(client, "/", "client 1");
    await getStreamConnectionConsumers(client, "/", "client 1");

    expect(client.request).toHaveBeenNthCalledWith(
      1,
      "/stream/connections/%2F/client%201",
      expect.any(Object),
    );
    expect(client.request).toHaveBeenNthCalledWith(
      2,
      "/stream/connections/%2F/client%201/publishers",
      expect.any(Object),
    );
    expect(client.request).toHaveBeenNthCalledWith(
      3,
      "/stream/connections/%2F/client%201/consumers",
      expect.any(Object),
    );
  });

  it("creates a super stream with partitions and arguments", async () => {
    const body = {
      partitions: 3,
      arguments: { "max-age": "1h" },
    };
    await createSuperStream(client, "/", "orders", body);

    expect(client.requestVoid).toHaveBeenCalledWith(
      "/stream/super-streams/%2F/orders",
      { method: "PUT", body: JSON.stringify(body) },
    );
  });
});
