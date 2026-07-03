import type { ExtensionResponse } from "@/domains/extensions/extension-schema";
import type { OverviewResponse } from "@/domains/overview/overview-schema";

export type OptionalFeatures = {
  federation: boolean;
  shovel: boolean;
  streams: boolean;
  top: boolean;
  tracing: boolean;
};

export type CapabilityRegistry = {
  rabbitmqVersion: string;
  managementVersion: string;
  userTags: readonly string[];
  visibleVhosts: readonly string[];
  detailedStatistics: boolean;
  optionalFeatures: OptionalFeatures;
};

type CapabilityInputs = {
  overview: OverviewResponse;
  userTags: readonly string[];
  vhosts: readonly { name: string }[];
  extensions: readonly ExtensionResponse[];
};

const EXTENSION_MARKERS = {
  federation: "federation.js",
  shovel: "shovel.js",
  streams: "stream.js",
  top: "top.js",
  tracing: "tracing.js",
} as const;

function getMarkerName(source: string): string {
  return source.split("?")[0]?.split("/").at(-1) ?? "";
}

export function resolveCapabilityRegistry({
  overview,
  userTags,
  vhosts,
  extensions,
}: CapabilityInputs): CapabilityRegistry {
  const markers = new Set(
    extensions.map((extension) => getMarkerName(extension.javascript_src)),
  );

  return {
    rabbitmqVersion: overview.rabbitmq_version,
    managementVersion: overview.management_version,
    userTags: [...userTags],
    visibleVhosts: vhosts.map((vhost) => vhost.name),
    detailedStatistics:
      !overview.disable_stats && overview.rates_mode !== "none",
    optionalFeatures: {
      federation: markers.has(EXTENSION_MARKERS.federation),
      shovel: markers.has(EXTENSION_MARKERS.shovel),
      streams: markers.has(EXTENSION_MARKERS.streams),
      top: markers.has(EXTENSION_MARKERS.top),
      tracing: markers.has(EXTENSION_MARKERS.tracing),
    },
  };
}

export function hasUserTag(
  registry: CapabilityRegistry,
  tag: string,
): boolean {
  return registry.userTags.includes(tag);
}
