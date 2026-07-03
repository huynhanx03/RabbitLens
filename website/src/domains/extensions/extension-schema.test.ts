import { describe, expect, it } from "vitest";
import { z } from "zod";
import { extensionSchema } from "./extension-schema";

describe("extensionSchema", () => {
  it("normalizes RabbitMQ 4.x legacy UI descriptors", () => {
    const result = z.array(extensionSchema).parse([
      { javascript: "federation.js" },
      { javascript: ["shovel.js", "shovel-extra.js"] },
      [],
    ]);

    expect(result).toEqual([
      { javascript_src: "federation.js" },
      { javascript_src: "shovel.js,shovel-extra.js" },
      { javascript_src: "" },
    ]);
  });

  it("keeps the normalized domain shape compatible", () => {
    expect(extensionSchema.parse({ javascript_src: "stream.js" })).toEqual({
      javascript_src: "stream.js",
    });
  });

  it("rejects unknown non-extension objects", () => {
    expect(() => extensionSchema.parse({ enabled: true })).toThrow();
  });
});
