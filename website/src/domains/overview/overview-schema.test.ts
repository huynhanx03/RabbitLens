import { describe, expect, it } from "vitest";
import { overviewSchema } from "./overview-schema";

describe("Overview Schema", () => {
  it("parses a full overview response with stats and totals", () => {
    const payload = {
      rabbitmq_version: "4.0.0",
      erlang_version: "27.0",
      management_version: "4.0.0",
      cluster_name: "rabbit@localhost",
      disable_stats: false,
      object_totals: {
        connections: 10,
        channels: 25,
        exchanges: 8,
        queues: 15,
        consumers: 40,
      },
      message_stats: {
        publish: 1500,
        publish_details: { rate: 25.5 },
        deliver_get: 1400,
        deliver_get_details: { rate: 20.1 },
        ack: 1400,
        ack_details: { rate: 20.1 },
      },
    };

    const parsed = overviewSchema.parse(payload);
    
    expect(parsed.object_totals?.connections).toBe(10);
    expect(parsed.message_stats?.publish_details?.rate).toBe(25.5);
  });

  it("handles missing stats gracefully when stats are disabled", () => {
    const payload = {
      rabbitmq_version: "4.0.0",
      erlang_version: "27.0",
      management_version: "4.0.0",
      cluster_name: "rabbit@localhost",
      disable_stats: true,
      // object_totals might be missing or empty
    };

    const parsed = overviewSchema.parse(payload);
    expect(parsed.disable_stats).toBe(true);
    expect(parsed.object_totals).toBeUndefined();
    expect(parsed.message_stats).toBeUndefined();
  });
});
