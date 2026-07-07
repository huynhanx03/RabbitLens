import { describe, expect, it } from "vitest";
import { messageResponseSchema, queueSchema } from "./queue-schema";
import { mockQueue } from "@/test/fixtures/queues";

describe("queueSchema", () => {
  it("parses a valid queue", () => {
    const parsed = queueSchema.parse(mockQueue);
    expect(parsed.name).toBe("my-queue");
    expect(parsed.type).toBe("classic");
    expect(parsed.message_stats?.publish_details?.rate).toBe(5.0);
  });

  it("tolerates missing optional fields", () => {
    const minimal = { name: "test-queue" };
    const parsed = queueSchema.parse(minimal);
    expect(parsed.name).toBe("test-queue");
    expect(parsed.type).toBeUndefined();
  });

  it("passes through unknown additive fields", () => {
    const withExtra = { ...mockQueue, unknown_future_field: "value" };
    const parsed = queueSchema.parse(withExtra);
    expect((parsed as any).unknown_future_field).toBe("value");
  });

  it("parses typed chart samples", () => {
    const parsed = queueSchema.parse({
      name: "sampled",
      messages_details: {
        rate: 1,
        samples: [{ timestamp: 1_700_000_000, sample: 42 }],
      },
    });

    expect(parsed.messages_details?.samples?.[0]).toEqual({
      timestamp: 1_700_000_000,
      sample: 42,
    });
  });

  it("validates message envelopes and preserves additive fields", () => {
    const parsed = messageResponseSchema.parse({
      payload_bytes: 5,
      redelivered: false,
      exchange: "events",
      routing_key: "created",
      message_count: 2,
      properties: { headers: { trace: "abc" } },
      payload: "hello",
      payload_encoding: "string",
      future_field: true,
    });

    expect(parsed.properties.headers).toEqual({ trace: "abc" });
    expect(parsed.future_field).toBe(true);
  });

  it("types policy replication and consumer details", () => {
    const parsed = queueSchema.parse({
      name: "orders",
      type: "quorum",
      leader: "rabbit@one",
      members: ["rabbit@one", "rabbit@two", "rabbit@three"],
      online: ["rabbit@one", "rabbit@two"],
      policy: "ha-orders",
      operator_policy: "guardrails",
      effective_policy_definition: { "delivery-limit": 20 },
      consumer_capacity: 0.75,
      consumer_details: [{
        consumer_tag: "worker",
        queue: { name: "orders", vhost: "/" },
      }],
    });

    expect(parsed.members).toHaveLength(3);
    expect(parsed.consumer_details?.[0]?.consumer_tag).toBe("worker");
    expect(parsed.effective_policy_definition?.["delivery-limit"]).toBe(20);
  });
});
