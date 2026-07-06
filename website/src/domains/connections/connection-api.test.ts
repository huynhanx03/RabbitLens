import { describe, expect, it, vi } from "vitest";
import { getConnections, getConnection, getConnectionSessions } from "./connection-api";
import { ManagementApiClient } from "@/api/management-api-client";

describe("connection API", () => {
  const getSession = vi.fn().mockReturnValue({ type: "anonymous" });
  const onUnauthorized = vi.fn();
  it("builds the correct list URL with search params", async () => {
    // We only want to test the URL it fetches, so we mock fetcher
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [], filtered_count: 0, item_count: 0, page: 1, page_count: 0, page_size: 100, total_count: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    
    const testClient = new ManagementApiClient({
      baseUrl: "http://localhost:15672/api",
      getSession,
      timeoutMs: 1000,
      onUnauthorized,
      fetcher,
    });

    await getConnections(testClient, {
      page: 2,
      pageSize: 50,
      name: "test",
      useRegex: false,
      sortReverse: false,
    });

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:15672/api/connections?page=2&page_size=50&name=test",
      expect.any(Object)
    );
  });

  it("builds the correct detail URL with encoding", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ name: "127.0.0.1:5672 -> 127.0.0.1:5555" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    
    const testClient = new ManagementApiClient({
      baseUrl: "http://localhost:15672/api",
      getSession,
      timeoutMs: 1000,
      onUnauthorized,
      fetcher,
    });

    // name contains spaces and arrows which need encoding
    await getConnection(testClient, "127.0.0.1:5672 -> 127.0.0.1:5555");

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:15672/api/connections/127.0.0.1%3A5672%20-%3E%20127.0.0.1%3A5555",
      expect.any(Object)
    );
  });

  it("loads AMQP 1.0 sessions from the encoded connection path", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const testClient = new ManagementApiClient({
      baseUrl: "http://localhost:15672/api",
      getSession,
      timeoutMs: 1000,
      onUnauthorized,
      fetcher,
    });
    const controller = new AbortController();

    await getConnectionSessions(testClient, "client -> rabbit", controller.signal);

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:15672/api/connections/client%20-%3E%20rabbit/sessions",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
