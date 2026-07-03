import type { LucideIcon } from "lucide-react";

export type NavigationGroupId =
  | "monitor"
  | "topology"
  | "administration"
  | "extensions";

export type NavigationItem = {
  id: string;
  labelKey: string;
  to: string;
  icon: LucideIcon;
  keywords: readonly string[];
  children?: NavigationChildItem[];
};

export type NavigationChildItem = {
  id: string;
  labelKey: string;
  to: string;
  keywords: readonly string[];
};

export type NavigationGroup = {
  id: NavigationGroupId;
  labelKey: string;
  items: NavigationItem[];
};
