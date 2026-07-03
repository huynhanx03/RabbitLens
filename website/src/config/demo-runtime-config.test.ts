import { describe, expect, it } from "vitest";
import runtimeConfigSource from "../../public/runtime-config.json?raw";
import { runtimeConfigSchema } from "./runtime-config-schema";

describe("demo runtime configuration", () => {
  it("enables only authentication services provided by the demo stack", () => {
    const config = runtimeConfigSchema.parse(JSON.parse(runtimeConfigSource));

    expect(config.auth).toEqual({ basic: true, oauth: null });
  });
});
