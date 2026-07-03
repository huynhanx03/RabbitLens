import type { Capabilities } from "@/api/capabilities";

export type KnownRabbitMqUserTag =
  | "administrator"
  | "monitoring"
  | "policymaker"
  | "management";

export type ActionCapability =
  | keyof Capabilities["features"]
  | keyof Capabilities["extensions"];

export type ActionPolicy = {
  requiredAnyTag?: readonly KnownRabbitMqUserTag[];
  requiresVisibleVhost?: boolean;
  requiredFeature?: ActionCapability;
  fineGrainedPermission?: "configure" | "write" | "read" | "topic";
};
