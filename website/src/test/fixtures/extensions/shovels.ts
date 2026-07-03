import type { ShovelStatusResponse } from "@/domains/extensions/shovels/shovel-schema";

export const mockShovels: ShovelStatusResponse[] = [
  {
    vhost: "/",
    name: "my-shovel-1",
    node: "rabbit@node1",
    type: "dynamic",
    state: "running",
    src_uri: "amqp://user:password123@remote1:5672",
    dest_uri: "amqp://user:password123@remote2:5672",
    timestamp: "2024-03-20 10:00:00",
  },
  {
    vhost: "test-vhost",
    name: "my-shovel-2",
    node: "rabbit@node2",
    type: "static",
    state: "terminated",
    src_uri: "amqps://admin:secret@remote:5671",
    dest_uri: "amqp://127.0.0.1:5672",
    timestamp: "2024-03-20 10:05:00",
    error: "connection refused",
  }
];
