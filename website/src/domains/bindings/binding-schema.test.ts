import { describe, expect, it } from "vitest";
import { bindingSchema } from "./binding-schema";

describe("bindingSchema", () => {
  it("parses a RabbitMQ queue binding and preserves arbitrary arguments", () => {
    expect(
      bindingSchema.parse({
        source: "orders.events",
        vhost: "/",
        destination: "orders",
        destination_type: "queue",
        routing_key: "order.created",
        arguments: { "x-match": "all", priority: 5, nested: { enabled: true } },
        properties_key: "order.created~%2F",
      }),
    ).toMatchObject({
      destination_type: "queue",
      arguments: { nested: { enabled: true } },
    });
  });

  it("rejects an unknown RabbitMQ binding destination type", () => {
    const result = bindingSchema.safeParse({
      source: "orders.events",
      vhost: "/",
      destination: "orders",
      destination_type: "stream",
      routing_key: "order.created",
      arguments: {},
      properties_key: "order.created",
    });

    expect(result.success).toBe(false);
  });
});
