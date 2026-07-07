import { describe, expect, it } from "vitest";
import { connectionSessionsSchema } from "./session-schema";

describe("connectionSessionsSchema", () => {
  it("accepts AMQP 1.0 sessions with incoming and outgoing links", () => {
    const result = connectionSessionsSchema.parse([{
      channel_number: 3,
      handle_max: 4294967295,
      next_incoming_id: 8,
      incoming_window: 100,
      next_outgoing_id: 12,
      remote_incoming_window: 50,
      remote_outgoing_window: 75,
      outgoing_unsettled_deliveries: 2,
      incoming_links: [{
        handle: 0,
        link_name: "publisher",
        target_address: "orders",
        snd_settle_mode: "mixed",
        max_message_size: 1048576,
        delivery_count: 10,
        credit: 20,
        unconfirmed_messages: 1,
      }],
      outgoing_links: [{
        handle: 1,
        link_name: "consumer",
        source_address: "orders",
        queue_name: "orders",
        send_settled: false,
        max_message_size: 1048576,
        delivery_count: 9,
        credit: 30,
        consumer_timeout: false,
        filter: [{ name: "selector", descriptor: "apache.org:selector-filter:string", value: "priority > 5" }],
      }],
    }]);

    expect(result[0]?.incoming_links[0]?.target_address).toBe("orders");
    expect(result[0]?.outgoing_links[0]?.filter?.[0]?.name).toBe("selector");
  });

  it("tolerates nullable and release-dependent link fields", () => {
    expect(connectionSessionsSchema.parse([{
      channel_number: 0,
      incoming_links: [],
      outgoing_links: [{ link_name: "consumer", queue_name: null, consumer_timeout: null }],
    }])).toHaveLength(1);
  });
});
