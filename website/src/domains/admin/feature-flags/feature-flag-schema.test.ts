import { describe, it, expect } from "vitest";
import { featureFlagSchema } from "./feature-flag-schema";
import { mockFeatureFlags } from "@/test/fixtures/feature-flags";

describe("featureFlagSchema", () => {
  it("validates valid feature flag responses", () => {
    mockFeatureFlags.forEach((ff) => {
      const result = featureFlagSchema.safeParse(ff);
      expect(result.success).toBe(true);
    });
  });
});
