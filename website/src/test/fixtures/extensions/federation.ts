import type { FederationLinkResponse } from "@/domains/extensions/federation/federation-schema";

export const mockFederationLinks: FederationLinkResponse[] = [
  {
    vhost: "/",
    id: "federation-link-id-1",
    node: "rabbit@node1",
    upstream: "my-upstream",
    exchange: "my-exchange",
    type: "exchange",
    status: "running",
    local_connection: "amqp://127.0.0.1:5672",
    uri: "amqp://user:password123@remote:5672",
    timestamp: "2024-03-20 10:00:00",
  },
  {
    vhost: "test-vhost",
    id: "federation-link-id-2",
    node: "rabbit@node1",
    upstream: "my-upstream-2",
    queue: "my-queue",
    type: "queue",
    status: "error",
    local_connection: "amqp://127.0.0.1:5672",
    uri: "amqps://admin:secret@remote:5671",
    timestamp: "2024-03-20 10:05:00",
    error: "connection refused",
  }
];
