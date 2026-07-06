import { z } from "zod";
import type { ManagementApiClient } from "@/api/management-api-client";

export const shovelValueSchema = z
  .record(z.string(), z.unknown())
  .refine((value) => "src-uri" in value && "dest-uri" in value, {
    message: "source and destination URIs are required",
  });

export const shovelParameterSchema = z
  .object({
    component: z.string().optional(),
    vhost: z.string(),
    name: z.string(),
    value: shovelValueSchema,
  })
  .passthrough();

export type ShovelParameter = z.infer<typeof shovelParameterSchema>;
export type ShovelValue = z.infer<typeof shovelValueSchema>;

export function buildMoveMessagesShovel(
  sourceQueue: string,
  destinationQueue: string,
  queueType: string | undefined,
): ShovelValue {
  return {
    "src-uri": "amqp:///",
    "src-queue": sourceQueue,
    "src-protocol": "amqp091",
    "src-prefetch-count": 1000,
    "src-delete-after": "queue-length",
    ...(queueType === "stream"
      ? { "src-consumer-args": { "x-stream-offset": "first" } }
      : {}),
    "dest-uri": "amqp:///",
    "dest-queue": destinationQueue,
    "dest-protocol": "amqp091",
    "dest-add-forward-headers": false,
    "ack-mode": "on-confirm",
  };
}

function parameterPath(vhost?: string, name?: string) {
  const root = "/parameters/shovel";
  if (vhost === undefined || name === undefined) return root;
  return `${root}/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`;
}

function shovelPath(vhost: string, name: string) {
  return `/shovels/vhost/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`;
}

export function getShovelParameters(client: ManagementApiClient) {
  return client.request(parameterPath(), z.array(shovelParameterSchema));
}

export function getShovelParameter(
  client: ManagementApiClient,
  vhost: string,
  name: string,
) {
  return client.request(parameterPath(vhost, name), shovelParameterSchema);
}

export async function putShovelParameter(
  client: ManagementApiClient,
  vhost: string,
  name: string,
  value: ShovelValue,
) {
  await client.requestVoid(parameterPath(vhost, name), {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}

export async function deleteShovel(
  client: ManagementApiClient,
  vhost: string,
  name: string,
) {
  await client.requestVoid(shovelPath(vhost, name), { method: "DELETE" });
}

export async function restartShovel(
  client: ManagementApiClient,
  vhost: string,
  name: string,
) {
  await client.requestVoid(`${shovelPath(vhost, name)}/restart`, {
    method: "DELETE",
  });
}

export function redactShovelUris(value: ShovelValue) {
  const redact = (input: unknown): unknown => {
    if (typeof input === "string") {
      return input.replace(/(amqps?:\/\/[^:/\s]+:)[^@/\s]+@/gi, "$1***@");
    }
    if (Array.isArray(input)) return input.map(redact);
    return input;
  };
  return {
    ...value,
    "src-uri": redact(value["src-uri"]),
    "dest-uri": redact(value["dest-uri"]),
  };
}
