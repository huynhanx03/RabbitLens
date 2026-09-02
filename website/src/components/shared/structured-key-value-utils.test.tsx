import { describe, expect, it } from "vitest";
import { objectToStructuredEntries } from "./structured-key-value-utils";

describe("objectToStructuredEntries", () => {
  it("rejects non-record inputs instead of making misleading operational rows", () => {
    expect(objectToStructuredEntries(null)).toEqual([]);
    expect(objectToStructuredEntries("orders")).toEqual([]);
    expect(objectToStructuredEntries(["orders"])).toEqual([]);
  });

  it("formats RabbitMQ scalar, nested and array argument values predictably", () => {
    expect(
      objectToStructuredEntries({
        durable: true,
        ttl: 30_000,
        missing: null,
        tags: ["orders", { region: "ap-southeast-1" }],
        arguments: { "x-dead-letter-exchange": "orders.retry" },
      }),
    ).toEqual([
      { key: "durable", value: "true", monospace: true },
      { key: "ttl", value: "30000", monospace: true },
      { key: "missing", value: "null", monospace: true },
      {
        key: "tags",
        value: 'orders, {"region":"ap-southeast-1"}',
        monospace: true,
      },
      {
        key: "arguments",
        value: '{"x-dead-letter-exchange":"orders.retry"}',
        monospace: true,
      },
    ]);
  });

  it("keeps empty arrays unambiguous", () => {
    expect(objectToStructuredEntries({ tags: [] })).toEqual([
      { key: "tags", value: "[]", monospace: true },
    ]);
  });
});
