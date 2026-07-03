import type { UserResponse, PermissionResponse, TopicPermissionResponse } from "@/domains/admin/users/user-schema";

export const mockUsers: UserResponse[] = [
  {
    name: "guest",
    password_hash: "abcd",
    tags: ["administrator"],
    limits: {},
  },
  {
    name: "monitoring-user",
    password_hash: "efgh",
    tags: ["monitoring"],
    limits: { "max-connections": 100 },
  }
];

export const mockPermissions: PermissionResponse[] = [
  {
    user: "guest",
    vhost: "/",
    configure: ".*",
    write: ".*",
    read: ".*",
  }
];

export const mockTopicPermissions: TopicPermissionResponse[] = [
  {
    user: "guest",
    vhost: "/",
    exchange: "amq.topic",
    write: ".*",
    read: ".*",
  }
];
