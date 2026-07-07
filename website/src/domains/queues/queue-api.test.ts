import { describe, expect, it, vi } from "vitest";
import { getMessages, getQueues, getQueue, runQueueAction } from "./queue-api";
import { ManagementApiClient } from "@/api/management-api-client";

describe("queue API", () => {
  const getSession = vi.fn().mockReturnValue({ type: "anonymous" });
  const onUnauthorized = vi.fn();

  it("builds the correct list URL with search params", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [], filtered_count: 0, item_count: 0, page: 1, page_count: 0, page_size: 100, total_count: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    
    const client = new ManagementApiClient({
      baseUrl: "http://localhost:15672/api",
      getSession,
      timeoutMs: 1000,
      onUnauthorized,
      fetcher,
    });

    await getQueues(client, {
      page: 1,
      pageSize: 50,
      name: "my-",
      useRegex: false,
      sortReverse: false,
    });

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:15672/api/queues?page=1&page_size=50&name=my-",
      expect.any(Object)
    );
  });

  it("builds the correct detail URL with encoding for vhost and name", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ name: "my-queue" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    
    const client = new ManagementApiClient({
      baseUrl: "http://localhost:15672/api",
      getSession,
      timeoutMs: 1000,
      onUnauthorized,
      fetcher,
    });

    // Special characters in vhost and queue name
    await getQueue(client, "/my-vhost", "my/queue");

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:15672/api/queues/%2Fmy-vhost/my%2Fqueue",
      expect.any(Object)
    );
  });

  it("parses get-message responses through the queue domain schema", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{
        payload_bytes: 5,
        redelivered: false,
        exchange: "events",
        routing_key: "created",
        message_count: 0,
        properties: {},
        payload: "hello",
        payload_encoding: "string",
      }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const client = new ManagementApiClient({
      baseUrl: "http://localhost:15672/api",
      getSession,
      timeoutMs: 1000,
      onUnauthorized,
      fetcher,
    });

    const messages = await getMessages(client, "/", "orders", {
      count: 1,
      ackmode: "ack_requeue_true",
      encoding: "auto",
    });

    expect(messages[0]?.payload).toBe("hello");
    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:15672/api/queues/%2F/orders/get",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("posts a typed synchronization action to the encoded queue path", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const client = new ManagementApiClient({
      baseUrl: "http://localhost:15672/api",
      getSession,
      timeoutMs: 1000,
      onUnauthorized,
      fetcher,
    });

    await runQueueAction(client, "/", "orders/priority", "sync");

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:15672/api/queues/%2F/orders%2Fpriority/actions",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ action: "sync" }) }),
    );
  });
});
