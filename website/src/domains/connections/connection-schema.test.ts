import { describe, expect, it } from "vitest";
import { connectionSchema } from "./connection-schema";
import { mockConnection } from "@/test/fixtures/connections";

describe("connectionSchema", () => {
  it("parses a valid connection", () => {
    const parsed = connectionSchema.parse(mockConnection);
    expect(parsed.name).toBe(mockConnection.name);
    expect(parsed.channels).toBe(3);
    expect(parsed.send_oct_details?.rate).toBe(100.5);
  });

  it("tolerates missing optional fields", () => {
    const minimal = { name: "test-connection" };
    const parsed = connectionSchema.parse(minimal);
    expect(parsed.name).toBe("test-connection");
    expect(parsed.state).toBeUndefined();
  });

  it("passes through unknown additive fields", () => {
    const withExtra = { ...mockConnection, unknown_future_field: "value" };
    const parsed = connectionSchema.parse(withExtra);
    expect((parsed as any).unknown_future_field).toBe("value");
  });
});
