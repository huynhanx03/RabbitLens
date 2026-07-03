import { type VhostResponse } from "@/domains/admin/vhosts/vhost-schema";

export const mockVhosts: VhostResponse[] = [
  {
    name: "/",
    description: "Default virtual host",
    tags: ["system"],
    default_queue_type: "classic",
    tracing: false,
    cluster_state: {
      "rabbit@node1": "running",
      "rabbit@node2": "running",
    },
    message_stats: {
      publish: 1500,
      publish_details: { rate: 25.5 },
      deliver_get: 1450,
      deliver_get_details: { rate: 24.1 },
    },
    messages: 50,
    messages_ready: 40,
    messages_unacknowledged: 10,
    recv_oct: 102400,
    recv_oct_details: { rate: 512 },
    send_oct: 204800,
    send_oct_details: { rate: 1024 },
  },
  {
    name: "test-vhost",
    description: "Test environment",
    tags: ["test", "temporary"],
    default_queue_type: "quorum",
    tracing: true,
    cluster_state: {
      "rabbit@node1": "stopped",
      "rabbit@node2": "running",
    },
    messages: 0,
    messages_ready: 0,
    messages_unacknowledged: 0,
  }
];
