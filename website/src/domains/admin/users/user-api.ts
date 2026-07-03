import type { ManagementApiClient } from "@/api/management-api-client";
import { 
  userSchema, type UserBody, type UserResponse,
  permissionSchema, type PermissionBody, type PermissionResponse,
  topicPermissionSchema, type TopicPermissionBody, type TopicPermissionResponse
} from "./user-schema";
import * as z from "zod";

export const userApi = {
  getUsers: async (client: ManagementApiClient): Promise<UserResponse[]> => {
    return client.request("/users", z.array(userSchema));
  },

  getUser: async (client: ManagementApiClient, name: string): Promise<UserResponse> => {
    return client.request(`/users/${encodeURIComponent(name)}`, userSchema);
  },

  putUser: async (
    client: ManagementApiClient,
    name: string,
    body: UserBody
  ): Promise<void> => {
    await client.requestVoid(`/users/${encodeURIComponent(name)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  deleteUser: async (client: ManagementApiClient, name: string): Promise<void> => {
    await client.requestVoid(`/users/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
  },

  getUserPermissions: async (client: ManagementApiClient, name: string): Promise<PermissionResponse[]> => {
    return client.request(`/users/${encodeURIComponent(name)}/permissions`, z.array(permissionSchema));
  },

  putUserPermission: async (
    client: ManagementApiClient,
    user: string,
    vhost: string,
    body: PermissionBody
  ): Promise<void> => {
    await client.requestVoid(`/permissions/${encodeURIComponent(vhost)}/${encodeURIComponent(user)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  deleteUserPermission: async (
    client: ManagementApiClient,
    user: string,
    vhost: string
  ): Promise<void> => {
    await client.requestVoid(`/permissions/${encodeURIComponent(vhost)}/${encodeURIComponent(user)}`, {
      method: "DELETE",
    });
  },

  getUserTopicPermissions: async (client: ManagementApiClient, name: string): Promise<TopicPermissionResponse[]> => {
    return client.request(`/users/${encodeURIComponent(name)}/topic-permissions`, z.array(topicPermissionSchema));
  },

  putUserTopicPermission: async (
    client: ManagementApiClient,
    user: string,
    vhost: string,
    body: TopicPermissionBody
  ): Promise<void> => {
    await client.requestVoid(`/topic-permissions/${encodeURIComponent(vhost)}/${encodeURIComponent(user)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  deleteUserTopicPermission: async (
    client: ManagementApiClient,
    user: string,
    vhost: string,
    exchange: string
  ): Promise<void> => {
    const path = [
      "/topic-permissions",
      encodeURIComponent(vhost),
      encodeURIComponent(user),
      encodeURIComponent(exchange),
    ].join("/");
    await client.requestVoid(path, { method: "DELETE" });
  },
};
