import { z } from "zod";
import type { ManagementApiClient } from "@/api/management-api-client";
import { paginatedResponseSchema, type ResourceListSearch } from "@/api/pagination-schema";
import { buildListQuery, withQuery } from "@/api/query-string";

const clientPropertiesSchema = z
  .object({
    connection_name: z.string().optional(),
    product: z.string().optional(),
    version: z.string().optional(),
    platform: z.string().optional(),
  })
  .passthrough();

export const streamConnectionSchema = z
  .object({
    name: z.string(),
    vhost: z.string(),
    node: z.string().optional(),
    user: z.string().optional(),
    state: z.string().optional(),
    ssl: z.boolean().optional(),
    protocol: z.string().optional(),
    frame_max: z.number().optional(),
    auth_mechanism: z.string().optional(),
    connected_at: z.number().optional(),
    timeout: z.number().optional(),
    host: z.string().optional(),
    port: z.number().optional(),
    peer_host: z.string().optional(),
    peer_port: z.number().optional(),
    client_properties: clientPropertiesSchema.optional(),
  })
  .passthrough();

export const streamPublisherSchema = z.record(z.string(), z.unknown());
export const streamConsumerSchema = z.record(z.string(), z.unknown());

const streamConnectionsSchema = paginatedResponseSchema(streamConnectionSchema);

export type StreamConnection = z.infer<typeof streamConnectionSchema>;
export type StreamPublisher = z.infer<typeof streamPublisherSchema>;
export type StreamConsumer = z.infer<typeof streamConsumerSchema>;

export type SuperStreamBody =
  | { partitions: number; arguments?: Record<string, unknown>; node?: string }
  | {
      "binding-keys": string;
      arguments?: Record<string, unknown>;
      node?: string;
    };

function connectionPath(vhost: string, name: string) {
  return `/stream/connections/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`;
}

export function getStreamConnections(
  client: ManagementApiClient,
  search: ResourceListSearch,
  signal?: AbortSignal,
) {
  return client.request(
    withQuery("/stream/connections", buildListQuery(search)),
    streamConnectionsSchema,
    { signal },
  );
}

export function getStreamConnection(
  client: ManagementApiClient,
  vhost: string,
  name: string,
) {
  return client.request(connectionPath(vhost, name), streamConnectionSchema);
}

export function getStreamConnectionPublishers(
  client: ManagementApiClient,
  vhost: string,
  name: string,
) {
  return client.request(
    `${connectionPath(vhost, name)}/publishers`,
    z.array(streamPublisherSchema),
  );
}

export function getStreamConnectionConsumers(
  client: ManagementApiClient,
  vhost: string,
  name: string,
) {
  return client.request(
    `${connectionPath(vhost, name)}/consumers`,
    z.array(streamConsumerSchema),
  );
}

export async function createSuperStream(
  client: ManagementApiClient,
  vhost: string,
  name: string,
  body: SuperStreamBody,
) {
  await client.requestVoid(
    `/stream/super-streams/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`,
    { method: "PUT", body: JSON.stringify(body) },
  );
}
