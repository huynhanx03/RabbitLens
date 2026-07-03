import { describe, expect, it } from "vitest";
import { exchangeSchema } from "./exchange-schema";
import { mockExchange } from "@/test/fixtures/exchanges";

describe("exchangeSchema", () => {
  it("parses a valid exchange", () => {
    const parsed = exchangeSchema.parse(mockExchange);
    expect(parsed.name).toBe("amq.direct");
    expect(parsed.type).toBe("direct");
    expect(parsed.message_stats?.publish_in_details?.rate).toBe(2.5);
  });

  it("tolerates missing optional fields", () => {
    const minimal = { name: "test-exchange" };
    const parsed = exchangeSchema.parse(minimal);
    expect(parsed.name).toBe("test-exchange");
    expect(parsed.type).toBeUndefined();
  });

  it("passes through unknown additive fields", () => {
    const withExtra = { ...mockExchange, unknown_future_field: "value" };
    const parsed = exchangeSchema.parse(withExtra);
    expect((parsed as any).unknown_future_field).toBe("value");
  });
});
