import {
  Boxes,
  Cable,
  FileJson,
  Flag,
  Gauge,
  GaugeCircle,
  ListTree,
  Network,
  Radio,
  ScrollText,
  Server,
  ShieldAlert,
  Users,
  Waypoints,
} from "lucide-react";
import { evaluatePermission } from "@/auth/permissions/permission-decision";
import { ADMIN_ACCESS_POLICY } from "@/features/admin/admin-navigation";
import { getAvailableExtensionNavigation } from "@/extensions/extension-registry";
import type { ExtensionDescriptor } from "@/extensions/extension-descriptor";
import type { NavigationGroup, NavigationItem } from "./navigation-types";

const monitorGroup: NavigationGroup = {
  id: "monitor",
  labelKey: "nav.groups.monitor",
  items: [
    {
      id: "overview",
      labelKey: "nav.overview",
      to: "/",
      icon: Gauge,
      keywords: ["dashboard", "cluster", "health"],
    },
    {
      id: "nodes",
      labelKey: "nav.nodes",
      to: "/nodes",
      icon: Server,
      keywords: ["node", "runtime", "memory"],
    },
  ],
};

const topologyGroup: NavigationGroup = {
  id: "topology",
  labelKey: "nav.groups.topology",
  items: [
    {
      id: "connections",
      labelKey: "nav.connections",
      to: "/connections",
      icon: Cable,
      keywords: ["client", "network", "channel"],
    },
    {
      id: "channels",
      labelKey: "nav.channels",
      to: "/channels",
      icon: Radio,
      keywords: ["channel", "consumer", "prefetch"],
    },
    {
      id: "exchanges",
      labelKey: "nav.exchanges",
      to: "/exchanges",
      icon: Waypoints,
      keywords: ["exchange", "routing", "binding"],
    },
    {
      id: "queues",
      labelKey: "nav.queues",
      to: "/queues",
      icon: ListTree,
      keywords: ["queue", "stream", "consumer"],
    },
  ],
};

const administrationGroup: NavigationGroup = {
  id: "administration",
  labelKey: "nav.groups.administration",
  items: [
    {
      id: "vhosts",
      labelKey: "vhosts.title",
      to: "/admin/vhosts",
      icon: Network,
      keywords: ["virtual host", "vhost"],
    },
    {
      id: "users",
      labelKey: "users.title",
      to: "/admin/users",
      icon: Users,
      keywords: ["user", "permission", "tag"],
    },
    {
      id: "policies",
      labelKey: "policies.title",
      to: "/admin/policies",
      icon: ScrollText,
      keywords: ["policy", "operator policy"],
    },
    {
      id: "limits",
      labelKey: "limits.title",
      to: "/admin/limits",
      icon: GaugeCircle,
      keywords: ["limit", "quota"],
    },
    {
      id: "feature-flags",
      labelKey: "featureFlags.title",
      to: "/admin/feature-flags",
      icon: Flag,
      keywords: ["feature", "flag"],
    },
    {
      id: "deprecated-features",
      labelKey: "deprecatedFeatures.title",
      to: "/admin/deprecated-features",
      icon: ShieldAlert,
      keywords: ["deprecated", "compatibility"],
    },
    {
      id: "cluster",
      labelKey: "cluster.title",
      to: "/admin/cluster",
      icon: Boxes,
      keywords: ["cluster", "name", "statistics"],
    },
    {
      id: "definitions",
      labelKey: "definitions.title",
      to: "/admin/definitions",
      icon: FileJson,
      keywords: ["definition", "import", "export"],
    },
  ],
};

export type BuildNavigationInput = {
  userTags: readonly string[];
  extensions: Array<{ javascript?: string; javascript_src?: string }>;
};

function toNavigationItem(
  extension: ExtensionDescriptor,
  userTags: readonly string[],
): NavigationItem {
  const user = { name: "navigation", tags: [...userTags] };
  return {
    id: extension.id,
    labelKey: extension.translationKey,
    to: extension.routePrefix,
    icon: extension.icon,
    keywords: extension.keywords,
    children: extension.children
      .filter((child) => evaluatePermission(child.accessPolicy, user, null).kind !== "deny")
      .map((child) => ({
        id: child.id,
        labelKey: child.translationKey,
        to: child.route,
        keywords: child.keywords,
      })),
  };
}

export function buildNavigation({
  userTags,
  extensions,
}: BuildNavigationInput): NavigationGroup[] {
  const groups = [monitorGroup, topologyGroup];
  const user = { name: "navigation", tags: [...userTags] };

  if (
    evaluatePermission(ADMIN_ACCESS_POLICY, user, null).kind !== "deny"
  ) {
    groups.push(administrationGroup);
  }

  const extensionItems = getAvailableExtensionNavigation(
    extensions,
    userTags,
  ).map((extension) => toNavigationItem(extension, userTags));

  if (extensionItems.length > 0) {
    groups.push({
      id: "extensions",
      labelKey: "nav.groups.extensions",
      items: extensionItems,
    });
  }

  return groups;
}
