export type ExtensionId =
  | "federation"
  | "shovel"
  | "streams"
  | "top"
  | "tracing";

import type { ActionPolicy } from "@/auth/permissions/action-policy";
import type { LucideIcon } from "lucide-react";

export type ExtensionChildDescriptor = {
  id: string;
  translationKey: string;
  route: `/extensions/${string}`;
  accessPolicy: ActionPolicy;
  keywords: readonly string[];
};

export type ExtensionDescriptor = {
  id: ExtensionId;
  marker: `${string}.js`;
  accessPolicy: ActionPolicy;
  translationKey: string;
  routePrefix: `/extensions/${string}`;
  navigationGroup: "operations" | "administration";
  icon: LucideIcon;
  keywords: readonly string[];
  children: readonly ExtensionChildDescriptor[];
};
