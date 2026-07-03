import type { Exchange } from "@/domains/exchanges/exchange-schema";
import type { PaginatedResponse } from "@/api/pagination-schema";

export const mockExchange: Exchange = {
  name: "amq.direct",
  vhost: "/",
  type: "direct",
  durable: true,
  auto_delete: false,
  internal: false,
  arguments: {},
  message_stats: {
    publish_in: 100,
    publish_in_details: { rate: 2.5 },
    publish_out: 100,
    publish_out_details: { rate: 2.5 },
  },
};

export const mockDefaultExchange: Exchange = {
  name: "",
  vhost: "/",
  type: "direct",
  durable: true,
  auto_delete: false,
  internal: false,
  arguments: {},
};

export const mockCustomExchange: Exchange = {
  name: "my-custom-exchange",
  vhost: "/custom",
  type: "topic",
  durable: false,
  auto_delete: true,
  internal: true,
  arguments: { "alternate-exchange": "amq.topic" },
};

export const mockPaginatedExchanges: PaginatedResponse<Exchange> = {
  items: [mockDefaultExchange, mockExchange, mockCustomExchange],
  filtered_count: 3,
  item_count: 3,
  page: 1,
  page_count: 1,
  page_size: 100,
  total_count: 3,
};
