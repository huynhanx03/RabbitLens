import type { ActionPolicy } from "./action-policy";
import type { Capabilities } from "@/api/capabilities";
import type { AuthenticatedUser } from "../auth-session";

export type PermissionDecision =
  | { kind: "allow" }
  | { kind: "deny"; reason: "tag" | "vhost" | "feature" }
  | { kind: "server" };

export function evaluatePermission(
  policy: ActionPolicy,
  user: AuthenticatedUser | null,
  capabilities: Capabilities | null,
  currentVhost?: string
): PermissionDecision {
  if (!user) {
    return { kind: "deny", reason: "tag" };
  }

  // 1. Tag check
  if (policy.requiredAnyTag && policy.requiredAnyTag.length > 0) {
    // If the user has "administrator", they implicitly satisfy any tag requirement
    const hasAdmin = user.tags.includes("administrator");
    const hasRequiredTag = hasAdmin || policy.requiredAnyTag.some(tag => user.tags.includes(tag));
    
    if (!hasRequiredTag) {
      return { kind: "deny", reason: "tag" };
    }
  }

  // 2. Vhost check
  if (policy.requiresVisibleVhost) {
    if (!currentVhost) {
      return { kind: "deny", reason: "vhost" };
    }
  }

  // 3. Feature check
  if (policy.requiredFeature) {
    if (!capabilities) {
      return { kind: "deny", reason: "feature" };
    }

    const isFeature = policy.requiredFeature in capabilities.features;
    const isExtension = policy.requiredFeature in capabilities.extensions;
    
    if (isFeature && !capabilities.features[policy.requiredFeature as keyof typeof capabilities.features]) {
      return { kind: "deny", reason: "feature" };
    }
    if (isExtension && !capabilities.extensions[policy.requiredFeature as keyof typeof capabilities.extensions]) {
      return { kind: "deny", reason: "feature" };
    }
  }

  // 4. Fine-grained check
  if (policy.fineGrainedPermission) {
    // We do not evaluate fine-grained ACLs in the browser. 
    // It is up to the backend to return 403.
    // But if the user is an administrator, we can safely allow it?
    // Wait, the plan says: "A fine-grained permission returns `server` unless an administrator is viewing explicit permission data in the Administration domain."
    // Actually, "returns `server`" is exactly what we want to avoid front-end predicting.
    return { kind: "server" };
  }

  return { kind: "allow" };
}
