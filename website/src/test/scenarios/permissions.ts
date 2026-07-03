import type { Capabilities } from "@/api/capabilities";
import type { AuthenticatedUser } from "@/auth/auth-session";

export const mockAdminUser: AuthenticatedUser = {
  name: "admin",
  tags: ["administrator"],
};

export const mockMonitoringUser: AuthenticatedUser = {
  name: "monitoring",
  tags: ["monitoring"],
};

export const mockPolicymakerUser: AuthenticatedUser = {
  name: "policymaker",
  tags: ["policymaker"],
};

export const mockManagementUser: AuthenticatedUser = {
  name: "management",
  tags: ["management"],
};

export const mockGuestUser: AuthenticatedUser = {
  name: "guest",
  tags: [],
};

export const mockDefaultCapabilities: Capabilities = {
  features: {
    statistics: true,
  },
  extensions: {
    federation: false,
    shovel: false,
    stream: false,
    top: false,
    tracing: false,
  },
};
