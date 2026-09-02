import { describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import {
  createBinding,
  deleteBinding,
  getExchangeBindingsDestination,
  getExchangeBindingsSource,
  getQueueBindings,
} from "./binding-api";

describe("binding API", () => {
  it("uses encoded source, destination, and queue binding endpoints", async () => {
    const request = vi.fn().mockResolvedValue([]);
    const client = { request } as unknown as ManagementApiClient;
    const signal = new AbortController().signal;

    await getExchangeBindingsSource(client, "/team a", "orders/new", signal);
    await getExchangeBindingsDestination(client, "/team a", "orders/new", signal);
    await getQueueBindings(client, "/team a", "orders/new", signal);

    expect(request).toHaveBeenNthCalledWith(
      1,
      "/exchanges/%2Fteam%20a/orders%2Fnew/bindings/source",
      expect.any(Object),
      { signal },
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      "/exchanges/%2Fteam%20a/orders%2Fnew/bindings/destination",
      expect.any(Object),
      { signal },
    );
    expect(request).toHaveBeenNthCalledWith(
      3,
      "/queues/%2Fteam%20a/orders%2Fnew/bindings",
      expect.any(Object),
      { signal },
    );
  });

  it("posts queue bindings using RabbitMQ's q destination discriminator", async () => {
    const requestVoid = vi.fn().mockResolvedValue(undefined);
    const client = { requestVoid } as unknown as ManagementApiClient;

    await createBinding(client, "/", "orders.events", "q", "orders/new", {
      routing_key: "order.created",
      arguments: { "x-match": "all", priority: 3 },
    });

    expect(requestVoid).toHaveBeenCalledWith("/bindings/%2F/e/orders.events/q/orders%2Fnew", {
      method: "POST",
      body: JSON.stringify({
        routing_key: "order.created",
        arguments: { "x-match": "all", priority: 3 },
      }),
    });
  });

  it("posts exchange-to-exchange bindings using RabbitMQ's e discriminator", async () => {
    const requestVoid = vi.fn().mockResolvedValue(undefined);
    const client = { requestVoid } as unknown as ManagementApiClient;

    await createBinding(client, "/team a", "source/exchange", "e", "target/exchange", {
      routing_key: "#",
      arguments: {},
    });

    expect(requestVoid).toHaveBeenCalledWith(
      "/bindings/%2Fteam%20a/e/source%2Fexchange/e/target%2Fexchange",
      { method: "POST", body: JSON.stringify({ routing_key: "#", arguments: {} }) },
    );
  });

  it("deletes an encoded binding by its RabbitMQ properties key", async () => {
    const requestVoid = vi.fn().mockResolvedValue(undefined);
    const client = { requestVoid } as unknown as ManagementApiClient;

    await deleteBinding(client, "/", "orders.events", "q", "orders/new", "key/%20");

    expect(requestVoid).toHaveBeenCalledWith(
      "/bindings/%2F/e/orders.events/q/orders%2Fnew/key%2F%2520",
      { method: "DELETE" },
    );
  });
});
