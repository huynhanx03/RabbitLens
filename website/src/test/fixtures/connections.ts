import type { Connection } from "@/domains/connections/connection-schema";
import type { PaginatedResponse } from "@/api/pagination-schema";

export const mockConnection: Connection = {
  name: "127.0.0.1:5672 -> 192.168.1.10:42356",
  node: "rabbit@localhost",
  vhost: "/",
  user: "guest",
  protocol: "AMQP 0-9-1",
  state: "running",
  ssl: false,
  peer_host: "192.168.1.10",
  peer_port: 42356,
  host: "127.0.0.1",
  port: 5672,
  connected_at: 1719504000000,
  channels: 3,
  send_oct: 2048,
  recv_oct: 4096,
  send_oct_details: { rate: 100.5 },
  recv_oct_details: { rate: 200.3 },
  type: "network",
  client_properties: {
    product: "RabbitMQ",
    platform: "Erlang/OTP",
  },
  timeout: 60,
  frame_max: 131072,
  channel_max: 2047,
};

export const mockBlockedConnection: Connection = {
  ...mockConnection,
  name: "127.0.0.1:5672 -> 192.168.1.10:55555",
  state: "blocked",
};

export const mockTlsConnection: Connection = {
  ...mockConnection,
  name: "127.0.0.1:5671 -> 192.168.1.10:44444",
  port: 5671,
  ssl: true,
  ssl_protocol: "TLSv1.3",
  ssl_cipher: "TLS_AES_256_GCM_SHA384",
  ssl_hash: "SHA384",
};

export const mockAmqp10Connection: Connection = {
  ...mockConnection,
  name: "127.0.0.1:5672 -> 192.168.1.10:33333",
  protocol: "AMQP 1-0",
};

export const mockPaginatedConnections: PaginatedResponse<Connection> = {
  items: [mockConnection, mockBlockedConnection, mockTlsConnection],
  filtered_count: 3,
  item_count: 3,
  page: 1,
  page_count: 1,
  page_size: 100,
  total_count: 3,
};
