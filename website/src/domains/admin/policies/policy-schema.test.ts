import { describe, it, expect } from "vitest";
import { policySchema, policyBodySchema } from "./policy-schema";
import { mockPolicies } from "@/test/fixtures/policies";

describe("policySchema", () => {
  it("validates valid policy responses", () => {
    mockPolicies.forEach((policy) => {
      const result = policySchema.safeParse(policy);
      expect(result.success).toBe(true);
    });
  });
});

describe("policyBodySchema", () => {
  it("validates valid creation bodies", () => {
    const body = {
      pattern: "^amq\\.",
      "apply-to": "exchanges",
      definition: { "federation-upstream-set": "all" },
      priority: 1,
    };
    const result = policyBodySchema.safeParse(body);
    expect(result.success).toBe(true);
  });
});
