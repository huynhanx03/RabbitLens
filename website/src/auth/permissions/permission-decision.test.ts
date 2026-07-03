import { describe, it, expect } from "vitest";
import { evaluatePermission } from "./permission-decision";
import type { Capabilities } from "@/api/capabilities";
import type { AuthenticatedUser } from "../auth-session";

describe("evaluatePermission", () => {
  const caps: Capabilities = {
    features: {
      statistics: true,
    },
    extensions: {
      federation: true,
      shovel: false,
      stream: false,
      top: false,
      tracing: false,
    }
  };

  const admin: AuthenticatedUser = { name: "admin", tags: ["administrator"] };
  const policymaker: AuthenticatedUser = { name: "policy", tags: ["policymaker"] };
  const guest: AuthenticatedUser = { name: "guest", tags: [] };

  it("denies if user is missing", () => {
    expect(evaluatePermission({}, null, caps).kind).toBe("deny");
  });

  it("denies if caps missing but feature required", () => {
    expect(evaluatePermission({ requiredFeature: "statistics" }, admin, null)).toEqual({ kind: "deny", reason: "feature" });
  });

  it("allows admin regardless of specific tags", () => {
    expect(evaluatePermission({ requiredAnyTag: ["policymaker"] }, admin, caps).kind).toBe("allow");
  });

  it("allows user with matching tag", () => {
    expect(evaluatePermission({ requiredAnyTag: ["policymaker"] }, policymaker, caps).kind).toBe("allow");
  });

  it("denies user missing required tag", () => {
    expect(evaluatePermission({ requiredAnyTag: ["policymaker"] }, guest, caps)).toEqual({ kind: "deny", reason: "tag" });
  });

  it("denies if required feature is missing", () => {
    expect(evaluatePermission({ requiredFeature: "statistics" }, admin, { ...caps, features: { statistics: false } })).toEqual({ kind: "deny", reason: "feature" });
  });

  it("denies if required extension is missing", () => {
    expect(evaluatePermission({ requiredFeature: "shovel" }, admin, caps)).toEqual({ kind: "deny", reason: "feature" });
  });

  it("allows if required feature/extension is present", () => {
    expect(evaluatePermission({ requiredFeature: "statistics" }, admin, caps).kind).toBe("allow");
    expect(evaluatePermission({ requiredFeature: "federation" }, admin, caps).kind).toBe("allow");
  });

  it("denies if vhost is required but none selected", () => {
    expect(evaluatePermission({ requiresVisibleVhost: true }, admin, caps, undefined)).toEqual({ kind: "deny", reason: "vhost" });
  });

  it("defers to server for fine grained checks", () => {
    expect(evaluatePermission({ fineGrainedPermission: "configure" }, admin, caps)).toEqual({ kind: "server" });
  });
});
