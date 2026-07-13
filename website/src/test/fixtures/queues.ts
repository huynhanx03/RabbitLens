import type { Queue } from "@/domains/queues/queue-schema";
import type { PaginatedResponse } from "@/api/pagination-schema";

export const mockQueue: Queue = {
  name: "my-queue",
  vhost: "/",
  type: "classic",
  node: "rabbit@localhost",
  state: "running",
  durable: true,
  auto_delete: false,
  exclusive: false,
  arguments: {},
  messages: 15,
  messages_ready: 10,
  messages_unacknowledged: 5,
  message_bytes: 1024,
  consumers: 2,
  message_stats: {
    publish: 100,
    publish_details: { rate: 5.0 },
    deliver: 80,
    deliver_details: { rate: 4.0 },
    deliver_get: 85,
    deliver_get_details: { rate: 4.5 },
    ack: 80,
    ack_details: { rate: 4.0 },
  },
};

export const mockQuorumQueue: Queue = {
  name: "quorum-queue",
  vhost: "/",
  type: "quorum",
  node: "rabbit@localhost",
  state: "running",
  durable: true,
  auto_delete: false,
  exclusive: false,
  arguments: {},
  messages: 0,
  messages_ready: 0,
  messages_unacknowledged: 0,
  message_bytes: 0,
  consumers: 0,
};

export const mockPaginatedQueues: PaginatedResponse<Queue> = {
  items: [mockQueue, mockQuorumQueue],
  filtered_count: 2,
  item_count: 2,
  page: 1,
  page_count: 1,
  page_size: 100,
  total_count: 2,
};
