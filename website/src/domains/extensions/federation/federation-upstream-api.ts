import { z } from "zod";
import type { ManagementApiClient } from "@/api/management-api-client";

export const federationUpstreamValueSchema = z
  .record(z.string(), z.unknown())
  .refine((value) => "uri" in value, { message: "uri is required" });

export const federationUpstreamSchema = z
  .object({
    component: z.string().optional(),
    vhost: z.string(),
    name: z.string(),
    value: federationUpstreamValueSchema,
  })
  .passthrough();

export type FederationUpstream = z.infer<typeof federationUpstreamSchema>;
export type FederationUpstreamValue = z.infer<
  typeof federationUpstreamValueSchema
>;

function upstreamPath(vhost?: string, name?: string) {
  const root = "/parameters/federation-upstream";
  if (vhost === undefined || name === undefined) return root;
  return `${root}/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`;
}

export function getFederationUpstreams(client: ManagementApiClient) {
  return client.request(upstreamPath(), z.array(federationUpstreamSchema));
}

export function getFederationUpstream(
  client: ManagementApiClient,
  vhost: string,
  name: string,
) {
  return client.request(
    upstreamPath(vhost, name),
    federationUpstreamSchema,
  );
}

export async function putFederationUpstream(
  client: ManagementApiClient,
  vhost: string,
  name: string,
  value: FederationUpstreamValue,
) {
  await client.requestVoid(upstreamPath(vhost, name), {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}

export async function deleteFederationUpstream(
  client: ManagementApiClient,
  vhost: string,
  name: string,
) {
  await client.requestVoid(upstreamPath(vhost, name), { method: "DELETE" });
}

export function redactFederationUris(value: FederationUpstreamValue) {
  const uri = value.uri;
  const redact = (input: string) =>
    input.replace(/(amqps?:\/\/[^:/\s]+:)[^@/\s]+@/gi, "$1***@");
  if (typeof uri === "string") return { ...value, uri: redact(uri) };
  if (Array.isArray(uri)) {
    return {
      ...value,
      uri: uri.map((item) => (typeof item === "string" ? redact(item) : item)),
    };
  }
  return value;
}
