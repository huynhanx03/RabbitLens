import { describe, expect, it } from "vitest";
import { resolveCapabilities } from "./capabilities";
import type { ExtensionResponse } from "@/domains/extensions/extension-schema";
import type { OverviewResponse } from "@/domains/overview/overview-schema";

describe("Capability Registry", () => {
  const defaultOverview: OverviewResponse = {
    rabbitmq_version: "4.0.0",
    erlang_version: "27.0",
    management_version: "4.0.0",
    cluster_name: "test-cluster",
    disable_stats: false,
  };
  
  const defaultExtensions: ExtensionResponse[] = [
    { javascript_src: "federation.js" },
  ];

  it("identifies disabled statistics", () => {
    const caps = resolveCapabilities(
      { ...defaultOverview, disable_stats: true },
      []
    );
    expect(caps.features.statistics).toBe(false);
  });

  it("identifies loaded extensions", () => {
    const caps = resolveCapabilities(defaultOverview, defaultExtensions);
    expect(caps.extensions.federation).toBe(true);
    expect(caps.extensions.shovel).toBe(false);
  });
});
