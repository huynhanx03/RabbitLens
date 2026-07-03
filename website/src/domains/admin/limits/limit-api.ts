import { z } from "zod";
import type { ManagementApiClient } from "@/api/management-api-client";
import { userLimitSchema, vhostLimitSchema } from "./limit-schema";

function limitPath(scope: "vhost" | "user", owner: string, name: string) {
  return `/${scope}-limits/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

export function getVhostLimits(client: ManagementApiClient) {
  return client.request("/vhost-limits", z.array(vhostLimitSchema));
}

export function getUserLimits(client: ManagementApiClient) {
  return client.request("/user-limits", z.array(userLimitSchema));
}

export async function putVhostLimit(
  client: ManagementApiClient,
  vhost: string,
  name: string,
  value: number,
) {
  await client.requestVoid(limitPath("vhost", vhost, name), {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}

export async function deleteVhostLimit(
  client: ManagementApiClient,
  vhost: string,
  name: string,
) {
  await client.requestVoid(limitPath("vhost", vhost, name), {
    method: "DELETE",
  });
}

export async function putUserLimit(
  client: ManagementApiClient,
  user: string,
  name: string,
  value: number,
) {
  await client.requestVoid(limitPath("user", user, name), {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}

export async function deleteUserLimit(
  client: ManagementApiClient,
  user: string,
  name: string,
) {
  await client.requestVoid(limitPath("user", user, name), {
    method: "DELETE",
  });
}
