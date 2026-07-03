import type { ExtensionResponse } from "@/domains/extensions/extension-schema";
import type { OverviewResponse } from "@/domains/overview/overview-schema";

export interface Capabilities {
  features: {
    statistics: boolean;
  };
  extensions: {
    federation: boolean;
    shovel: boolean;
    stream: boolean;
    top: boolean;
    tracing: boolean;
  };
}

export function resolveCapabilities(
  overview: OverviewResponse,
  extensions: ExtensionResponse[]
): Capabilities {
  const hasExtension = (name: string) => 
    extensions.some((ext) => ext.javascript_src.includes(name));

  return {
    features: {
      statistics: !overview.disable_stats,
    },
    extensions: {
      federation: hasExtension("federation"),
      shovel: hasExtension("shovel"),
      stream: hasExtension("stream"),
      top: hasExtension("top"),
      tracing: hasExtension("tracing"),
    },
  };
}
