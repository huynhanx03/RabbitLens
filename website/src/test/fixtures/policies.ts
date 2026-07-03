import type { PolicyResponse } from "@/domains/admin/policies/policy-schema";

export const mockPolicies: PolicyResponse[] = [
  {
    vhost: "/",
    name: "ha-all",
    pattern: "^ha\\.",
    "apply-to": "all",
    definition: {
      "ha-mode": "all",
    },
    priority: 0,
  }
];

export const mockOperatorPolicies: PolicyResponse[] = [
  {
    vhost: "/",
    name: "operator-ha",
    pattern: ".*",
    "apply-to": "queues",
    definition: {
      "message-ttl": 60000,
    },
    priority: 10,
  }
];
