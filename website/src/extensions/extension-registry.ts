import type { ExtensionDescriptor, ExtensionId } from "./extension-descriptor";
import { Activity, GitFork, MoveRight, ScanLine, Waves } from "lucide-react";

export const extensionRegistry: ExtensionDescriptor[] = [
  {
    id: "federation",
    marker: "federation.js",
    accessPolicy: { requiredAnyTag: ["monitoring", "policymaker"] },
    translationKey: "federation.title",
    routePrefix: "/extensions/federation/status",
    navigationGroup: "operations",
    icon: GitFork,
    keywords: ["federation", "upstream", "link"],
    children: [
      { id: "federation-status", translationKey: "federation.statusTitle", route: "/extensions/federation/status", accessPolicy: { requiredAnyTag: ["monitoring", "policymaker"] }, keywords: ["link", "status"] },
      { id: "federation-upstreams", translationKey: "federation.upstreams", route: "/extensions/federation/upstreams", accessPolicy: { requiredAnyTag: ["policymaker"] }, keywords: ["upstream", "parameter"] },
    ],
  },
  {
    id: "shovel",
    marker: "shovel.js",
    accessPolicy: { requiredAnyTag: ["monitoring", "policymaker"] },
    translationKey: "shovels.title",
    routePrefix: "/extensions/shovels/status",
    navigationGroup: "operations",
    icon: MoveRight,
    keywords: ["shovel", "move", "message"],
    children: [
      { id: "shovel-status", translationKey: "shovels.statusTitle", route: "/extensions/shovels/status", accessPolicy: { requiredAnyTag: ["monitoring", "policymaker"] }, keywords: ["worker", "status"] },
      { id: "shovel-management", translationKey: "shovels.management", route: "/extensions/shovels/management", accessPolicy: { requiredAnyTag: ["policymaker"] }, keywords: ["dynamic", "parameter"] },
    ],
  },
  {
    id: "streams",
    marker: "stream.js",
    accessPolicy: { requiredAnyTag: ["monitoring", "policymaker"] },
    translationKey: "streams.title",
    routePrefix: "/extensions/streams/connections",
    navigationGroup: "operations",
    icon: Waves,
    keywords: ["stream", "publisher", "consumer"],
    children: [
      { id: "stream-connections", translationKey: "streams.connections", route: "/extensions/streams/connections", accessPolicy: { requiredAnyTag: ["monitoring", "policymaker"] }, keywords: ["connection", "publisher", "consumer"] },
      { id: "stream-super-streams", translationKey: "streams.superStreams", route: "/extensions/streams/super-streams", accessPolicy: { requiredAnyTag: ["policymaker"] }, keywords: ["super stream", "partition"] },
    ],
  },
  {
    id: "top",
    marker: "top.js",
    accessPolicy: { requiredAnyTag: ["administrator"] },
    translationKey: "top.title",
    routePrefix: "/extensions/top",
    navigationGroup: "administration",
    icon: Activity,
    keywords: ["top", "process", "ets"],
    children: [
      { id: "top-processes", translationKey: "top.processes", route: "/extensions/top", accessPolicy: { requiredAnyTag: ["administrator"] }, keywords: ["process", "pid"] },
      { id: "top-ets", translationKey: "top.etsTables", route: "/extensions/top/ets", accessPolicy: { requiredAnyTag: ["administrator"] }, keywords: ["ets", "table"] },
    ],
  },
  {
    id: "tracing",
    marker: "tracing.js",
    accessPolicy: { requiredAnyTag: ["administrator"] },
    translationKey: "tracing.title",
    routePrefix: "/extensions/tracing",
    navigationGroup: "administration",
    icon: ScanLine,
    keywords: ["trace", "tracing", "log"],
    children: [
      { id: "tracing-traces", translationKey: "tracing.traces", route: "/extensions/tracing", accessPolicy: { requiredAnyTag: ["administrator"] }, keywords: ["trace", "log", "file"] },
    ],
  },
];

import { evaluatePermission } from "@/auth/permissions/permission-decision";

export function isExtensionInstalled(
  id: ExtensionId,
  availableMarkers: Array<{ javascript?: string; javascript_src?: string }>,
): boolean {
  const descriptor = extensionRegistry.find(ext => ext.id === id);
  if (!descriptor) return false;

  return availableMarkers.some(ext =>
    ext.javascript === descriptor.marker || 
    (ext.javascript_src && ext.javascript_src.includes(descriptor.marker))
  );
}

export function getAvailableExtensionNavigation(
  availableMarkers: Array<{ javascript?: string; javascript_src?: string }>,
  userTags: readonly string[]
): ExtensionDescriptor[] {
  const user = { name: "navigation", tags: [...userTags] };

  return extensionRegistry.filter(
    (descriptor) =>
      isExtensionInstalled(descriptor.id, availableMarkers) &&
      evaluatePermission(descriptor.accessPolicy, user, null).kind !== "deny",
  );
}
