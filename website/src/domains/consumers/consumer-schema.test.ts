import { describe, expect, it } from "vitest";
import { consumerSchema } from "./consumer-schema";

describe("consumerSchema", () => {
  it("accepts an AMQP channel consumer", () => {
    const consumer = consumerSchema.parse({
      consumer_tag: "worker-1",
      queue: { name: "orders", vhost: "/" },
      channel_details: { name: "client (1)", connection_name: "client" },
      ack_required: true,
      exclusive: false,
      prefetch_count: 100,
      active: true,
      activity_status: "up",
      consumer_timeout: 1800000,
      arguments: { "x-priority": 5 },
    });

    expect(consumer.channel_details?.name).toBe("client (1)");
    expect(consumer.arguments?.["x-priority"]).toBe(5);
  });

  it("accepts stream and older consumer shapes with nullable status", () => {
    expect(consumerSchema.parse({
      consumer_tag: "stream.subid-0",
      queue: { name: "events", vhost: "streams" },
      channel_details: { connection_name: "stream-client" },
      consumer_timeout: null,
      active: null,
    }).active).toBeNull();
  });
});
