import { describe, it, expect } from "vitest";
import { deprecatedFeatureSchema } from "./deprecated-feature-schema";
import { mockDeprecatedFeatures } from "@/test/fixtures/feature-flags";

describe("deprecatedFeatureSchema", () => {
  it("validates valid deprecated feature responses", () => {
    mockDeprecatedFeatures.forEach((df) => {
      const result = deprecatedFeatureSchema.safeParse(df);
      expect(result.success).toBe(true);
    });
  });
});
