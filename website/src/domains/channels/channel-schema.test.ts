import { describe, expect, it } from "vitest";
import { channelSchema } from "./channel-schema";
import { mockChannel } from "@/test/fixtures/channels";

describe("channelSchema", () => {
  it("parses a valid channel", () => {
    const parsed = channelSchema.parse(mockChannel);
    expect(parsed.name).toBe(mockChannel.name);
    expect(parsed.number).toBe(1);
    expect(parsed.message_stats?.publish_details?.rate).toBe(10.5);
  });

  it("tolerates missing optional fields", () => {
    const minimal = { name: "test-channel" };
    const parsed = channelSchema.parse(minimal);
    expect(parsed.name).toBe("test-channel");
    expect(parsed.state).toBeUndefined();
  });

  it("accepts direct-channel sentinels returned by RabbitMQ 4.3", () => {
    const parsed = channelSchema.parse({
      name: "<rabbit@rabbitmq.1.2.3> (1)",
      connection_details: {
        name: "<rabbit@rabbitmq.1.2.3>",
        peer_host: "undefined",
        peer_port: "undefined",
      },
      global_prefetch_count: null,
      message_stats: null,
    });

    expect(parsed.connection_details?.peer_port).toBe("undefined");
    expect(parsed.global_prefetch_count).toBeNull();
    expect(parsed.message_stats).toBeNull();
  });

  it("passes through unknown additive fields", () => {
    const withExtra = { ...mockChannel, unknown_future_field: "value" };
    const parsed = channelSchema.parse(withExtra);
    expect((parsed as any).unknown_future_field).toBe("value");
  });

  it("types consumer and Raft diagnostics", () => {
    const parsed = channelSchema.parse({
      name: "channel",
      pending_raft_commands: 2,
      cached_segments: 4,
      consumer_details: [{
        consumer_tag: "worker",
        queue: { name: "orders", vhost: "/" },
        prefetch_count: 50,
      }],
    });

    expect(parsed.consumer_details?.[0]?.consumer_tag).toBe("worker");
    expect(parsed.pending_raft_commands).toBe(2);
  });
});
