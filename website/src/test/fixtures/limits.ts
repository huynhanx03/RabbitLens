import type { VhostLimit } from "@/domains/admin/limits/limit-schema";

export const mockLimits: VhostLimit[] = [
  {
    vhost: "/",
    value: { "max-connections": 100 },
  },
  {
    vhost: "test-vhost",
    value: { "max-queues": -1 },
  }
];
