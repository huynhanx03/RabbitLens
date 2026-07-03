import { describe, it, expect } from "vitest";
import { shovelStatusSchema } from "./shovel-schema";
import { mockShovels } from "@/test/fixtures/extensions/shovels";

describe("shovelStatusSchema", () => {
  it("validates valid shovel responses", () => {
    mockShovels.forEach((ff) => {
      const result = shovelStatusSchema.safeParse(ff);
      expect(result.success).toBe(true);
    });
  });
});
