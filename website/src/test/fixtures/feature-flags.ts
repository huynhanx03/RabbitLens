import type { FeatureFlagResponse } from "@/domains/admin/feature-flags/feature-flag-schema";
import type { DeprecatedFeatureResponse } from "@/domains/admin/deprecated-features/deprecated-feature-schema";

export const mockFeatureFlags: FeatureFlagResponse[] = [
  {
    name: "quorum_queue",
    desc: "Quorum queues",
    state: "enabled",
    provided_by: "rabbit",
  },
  {
    name: "stream_queue",
    desc: "Stream queues",
    state: "disabled",
    provided_by: "rabbit",
  }
];

export const mockDeprecatedFeatures: DeprecatedFeatureResponse[] = [
  {
    name: "classic_mirrored_queues",
    desc: "Classic Mirrored Queues",
    docs_url: "https://www.rabbitmq.com/classic-mirrored-queues",
  }
];
