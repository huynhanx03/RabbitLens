import type { ManagementApiClient } from "@/api/management-api-client";
import { paginatedResponseSchema } from "@/api/pagination-schema";
import { buildListQuery, withQuery } from "@/api/query-string";
import type { ResourceListSearch } from "@/api/pagination-schema";
import { messageResponseListSchema, queueSchema } from "./queue-schema";

const paginatedQueuesSchema = paginatedResponseSchema(queueSchema);

export async function getQueues(
  client: ManagementApiClient,
  search: ResourceListSearch,
  signal?: AbortSignal,
) {
  const query = buildListQuery(search);
  return client.request(
    withQuery("/queues", query),
    paginatedQueuesSchema,
    { signal },
  );
}

export async function getQueue(
  client: ManagementApiClient,
  vhost: string,
  name: string,
  rangeParams?: URLSearchParams,
  signal?: AbortSignal,
) {
  const path = `/queues/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`;
  const query = rangeParams?.toString() ?? "";
  return client.request(withQuery(path, query), queueSchema, { signal });
}

export interface CreateQueueRequest {
  auto_delete: boolean;
  durable: boolean;
  arguments: Record<string, string | number | boolean>;
  node?: string; // Optional target node
}

export async function createQueue(
  client: ManagementApiClient,
  vhost: string,
  name: string,
  request: CreateQueueRequest,
) {
  const path = `/queues/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`;
  return client.requestVoid(path, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export async function deleteQueue(
  client: ManagementApiClient,
  vhost: string,
  name: string,
  options: { ifUnused?: boolean; ifEmpty?: boolean } = {},
) {
  const path = `/queues/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`;
  const params = new URLSearchParams();
  if (options.ifUnused) params.set("if-unused", "true");
  if (options.ifEmpty) params.set("if-empty", "true");
  
  const query = params.toString();
  return client.requestVoid(withQuery(path, query), {
    method: "DELETE",
  });
}

export async function purgeQueue(
  client: ManagementApiClient,
  vhost: string,
  name: string,
) {
  const path = `/queues/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}/contents`;
  return client.requestVoid(path, {
    method: "DELETE",
  });
}

export interface GetMessagesRequest {
  count: number;
  ackmode: "ack_requeue_true" | "ack_requeue_false" | "reject_requeue_true" | "reject_requeue_false";
  encoding: "auto" | "base64";
  truncate?: number;
}

export async function getMessages(
  client: ManagementApiClient,
  vhost: string,
  name: string,
  request: GetMessagesRequest,
) {
  const path = `/queues/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}/get`;
  return client.request(path, messageResponseListSchema, {
    method: "POST",
    body: JSON.stringify(request),
  });
}
