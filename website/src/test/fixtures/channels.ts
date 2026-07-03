import type { Channel } from "@/domains/channels/channel-schema";
import type { PaginatedResponse } from "@/api/pagination-schema";

export const mockChannel: Channel = {
  name: "127.0.0.1:5672 -> 192.168.1.10:42356 (1)",
  node: "rabbit@localhost",
  connection_details: {
    name: "127.0.0.1:5672 -> 192.168.1.10:42356",
    peer_host: "192.168.1.10",
    peer_port: 42356,
  },
  user: "guest",
  vhost: "/",
  number: 1,
  state: "running",
  idle_since: "2024-06-27 12:00:00",
  transactional: false,
  confirm: true,
  consumer_count: 2,
  messages_unacknowledged: 15,
  messages_unconfirmed: 5,
  messages_uncommitted: 0,
  acks_uncommitted: 0,
  prefetch_count: 100,
  global_prefetch_count: 0,
  message_stats: {
    publish: 500,
    publish_details: { rate: 10.5 },
    deliver_get: 400,
    deliver_get_details: { rate: 8.2 },
    ack: 385,
    ack_details: { rate: 7.9 },
    redeliver: 5,
    redeliver_details: { rate: 0.1 },
  },
};

export const mockPaginatedChannels: PaginatedResponse<Channel> = {
  items: [mockChannel],
  filtered_count: 1,
  item_count: 1,
  page: 1,
  page_count: 1,
  page_size: 100,
  total_count: 1,
};
