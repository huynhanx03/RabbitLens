import { Shield } from "lucide-react";
import type { ActionPolicy } from "@/auth/permissions/action-policy";

export const ADMIN_ACCESS_POLICY: ActionPolicy = {
  requiredAnyTag: ["administrator", "policymaker"],
};

export const adminNavigation = [
  {
    title: "Admin",
    href: "/admin/vhosts", // Default route
    icon: Shield,
    // Note: We'll show this group in the main nav if the user has ANY admin capability.
  },
];
