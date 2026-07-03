import { describe, expect, it } from "vitest";
import { resolveCapabilityRegistry } from "./capability-registry";

const overview = {
  rabbitmq_version: "4.4.0",
  erlang_version: "28.0",
  management_version: "4.4.0",
  cluster_name: "rabbit@cluster",
  disable_stats: false,
  rates_mode: "basic" as const,
};

describe("resolveCapabilityRegistry", () => {
  it("keeps exact user tags and visible virtual hosts", () => {
    const registry = resolveCapabilityRegistry({
      overview,
      userTags: ["management", "custom"],
      vhosts: [{ name: "/" }, { name: "orders" }],
      extensions: [],
    });

    expect(registry.userTags).toEqual(["management", "custom"]);
    expect(registry.visibleVhosts).toEqual(["/", "orders"]);
    expect(registry.detailedStatistics).toBe(true);
  });

  it("disables detailed statistics for disabled stats or rates mode none", () => {
    expect(
      resolveCapabilityRegistry({
        overview: { ...overview, disable_stats: true },
        userTags: [],
        vhosts: [],
        extensions: [],
      }).detailedStatistics,
    ).toBe(false);

    expect(
      resolveCapabilityRegistry({
        overview: { ...overview, rates_mode: "none" },
        userTags: [],
        vhosts: [],
        extensions: [],
      }).detailedStatistics,
    ).toBe(false);
  });

  it("matches optional extension marker filenames exactly", () => {
    const registry = resolveCapabilityRegistry({
      overview,
      userTags: ["administrator"],
      vhosts: [],
      extensions: [
        { javascript_src: "js/federation.js" },
        { javascript_src: "js/not-shovel.js" },
        { javascript_src: "stream.js?cache=1" },
      ],
    });

    expect(registry.optionalFeatures).toEqual({
      federation: true,
      shovel: false,
      streams: true,
      top: false,
      tracing: false,
    });
  });
});
