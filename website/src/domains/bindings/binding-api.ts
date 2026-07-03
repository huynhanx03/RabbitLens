import { z } from "zod";
import type { ManagementApiClient } from "@/api/management-api-client";
import { bindingSchema } from "./binding-schema";

const bindingsArraySchema = z.array(bindingSchema);

export async function getExchangeBindingsSource(
  client: ManagementApiClient,
  vhost: string,
  exchange: string,
  signal?: AbortSignal,
) {
  const path = `/exchanges/${encodeURIComponent(vhost)}/${encodeURIComponent(exchange)}/bindings/source`;
  return client.request(path, bindingsArraySchema, { signal });
}

export async function getExchangeBindingsDestination(
  client: ManagementApiClient,
  vhost: string,
  exchange: string,
  signal?: AbortSignal,
) {
  const path = `/exchanges/${encodeURIComponent(vhost)}/${encodeURIComponent(exchange)}/bindings/destination`;
  return client.request(path, bindingsArraySchema, { signal });
}

export async function getQueueBindings(
  client: ManagementApiClient,
  vhost: string,
  queue: string,
  signal?: AbortSignal,
) {
  const path = `/queues/${encodeURIComponent(vhost)}/${encodeURIComponent(queue)}/bindings`;
  return client.request(path, bindingsArraySchema, { signal });
}

export interface CreateBindingRequest {
  routing_key: string;
  arguments: Record<string, string | number | boolean>;
}

export async function createBinding(
  client: ManagementApiClient,
  vhost: string,
  exchange: string,
  destinationType: "q" | "e",
  destination: string,
  request: CreateBindingRequest,
) {
  const path = `/bindings/${encodeURIComponent(vhost)}/e/${encodeURIComponent(exchange)}/${destinationType}/${encodeURIComponent(destination)}`;
  return client.requestVoid(path, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function deleteBinding(
  client: ManagementApiClient,
  vhost: string,
  exchange: string,
  destinationType: "q" | "e",
  destination: string,
  propertiesKey: string,
) {
  const path = `/bindings/${encodeURIComponent(vhost)}/e/${encodeURIComponent(exchange)}/${destinationType}/${encodeURIComponent(destination)}/${encodeURIComponent(propertiesKey)}`;
  return client.requestVoid(path, {
    method: "DELETE",
  });
}
