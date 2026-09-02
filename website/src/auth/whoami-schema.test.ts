import { describe, expect, it } from "vitest";
import { whoAmISchema } from "./whoami-schema";

describe("whoAmISchema", () => {
  it("accepts a RabbitMQ identity response with optional server metadata", () => {
    expect(
      whoAmISchema.parse({
        name: "operator",
        tags: ["administrator"],
        is_internal_user: true,
        login_session_timeout: 15,
        future_field: "preserved",
      }),
    ).toMatchObject({ name: "operator", tags: ["administrator"], login_session_timeout: 15 });
  });

  it("rejects invalid identity fields and non-positive session timeouts", () => {
    expect(whoAmISchema.safeParse({ name: 42, tags: [] }).success).toBe(false);
    expect(
      whoAmISchema.safeParse({
        name: "operator",
        tags: ["administrator"],
        login_session_timeout: 0,
      }).success,
    ).toBe(false);
  });
});
