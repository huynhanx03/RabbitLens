import type { ManagementApiClient } from "@/api/management-api-client";
import { paginatedResponseSchema } from "@/api/pagination-schema";
import { buildListQuery, withQuery } from "@/api/query-string";
import type { ResourceListSearch } from "@/api/pagination-schema";
import { exchangeSchema } from "./exchange-schema";

const paginatedExchangesSchema = paginatedResponseSchema(exchangeSchema);

export async function getExchanges(
  client: ManagementApiClient,
  search: ResourceListSearch,
  signal?: AbortSignal,
) {
  const query = buildListQuery(search);
  return client.request(
    withQuery("/exchanges", query),
    paginatedExchangesSchema,
    { signal },
  );
}

export async function getExchange(
  client: ManagementApiClient,
  vhost: string,
  name: string,
  rangeParams?: URLSearchParams,
  signal?: AbortSignal,
) {
  const path = `/exchanges/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`;
  const query = rangeParams?.toString() ?? "";
  return client.request(withQuery(path, query), exchangeSchema, { signal });
}

export interface CreateExchangeRequest {
  type: string;
  auto_delete: boolean;
  durable: boolean;
  internal: boolean;
  arguments: Record<string, string | number | boolean>;
}

export async function createExchange(
  client: ManagementApiClient,
  vhost: string,
  name: string,
  request: CreateExchangeRequest,
) {
  const path = `/exchanges/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`;
  return client.requestVoid(path, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export async function deleteExchange(
  client: ManagementApiClient,
  vhost: string,
  name: string,
  ifUnused: boolean = false,
) {
  const path = `/exchanges/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`;
  return client.requestVoid(ifUnused ? `${path}?if-unused=true` : path, {
    method: "DELETE",
  });
}

export interface PublishMessageRequest {
  routing_key: string;
  payload: string;
  payload_encoding: "string" | "base64";
  properties: Record<string, string | number | boolean>;
  props?: Record<string, string | number | boolean>; // RabbitMQ sometimes uses props
}

import { z } from "zod";

export const publishMessageResponseSchema = z.object({
  routed: z.boolean(),
});

export type PublishMessageResponse = z.infer<typeof publishMessageResponseSchema>;

export async function publishMessage(
  client: ManagementApiClient,
  vhost: string,
  name: string,
  request: PublishMessageRequest,
) {
  // If name is empty string, use 'amq.default' or just empty string. Management API uses '%2F' or similar for default but actually for publish it accepts 'amq.default' as the default exchange or the empty name with encodeURIComponent. Let's encode name.
  // Actually, default exchange name in URL is 'amq.default' for API.
  const apiName = name === "" ? "amq.default" : name;
  const path = `/exchanges/${encodeURIComponent(vhost)}/${encodeURIComponent(apiName)}/publish`;
  return client.request(path, publishMessageResponseSchema, {
    method: "POST",
    body: JSON.stringify({
      ...request,
      // Ensure props and properties are set
      props: request.properties,
      properties: request.properties,
    }),
  });
}
