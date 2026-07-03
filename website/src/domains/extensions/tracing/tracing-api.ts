import { z } from "zod";
import type { ManagementApiClient } from "@/api/management-api-client";

export const traceSchema = z
  .object({
    vhost: z.string(),
    name: z.string(),
    format: z.enum(["text", "json"]),
    pattern: z.string(),
    max_payload_bytes: z.number().optional(),
    tracer_connection_username: z.string().optional(),
    queue: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const traceFileSchema = z
  .object({
    name: z.string(),
    size: z.number().optional(),
    mtime: z.union([z.number(), z.string()]).optional(),
  })
  .passthrough();

export const traceBodySchema = z.object({
  format: z.enum(["text", "json"]),
  pattern: z.string().min(1),
  max_payload_bytes: z.number().int().min(0).optional(),
  tracer_connection_username: z.string().optional(),
  tracer_connection_password: z.string().optional(),
});

export type Trace = z.infer<typeof traceSchema>;
export type TraceFile = z.infer<typeof traceFileSchema>;
export type TraceBody = z.infer<typeof traceBodySchema>;

function nodePath(prefix: string, node: string) {
  return `${prefix}/node/${encodeURIComponent(node)}`;
}

function tracePath(node: string, vhost: string, name: string) {
  return `${nodePath("/traces", node)}/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`;
}

export function getTraces(client: ManagementApiClient, node: string) {
  return client.request(
    nodePath("/traces", node),
    z.array(traceSchema),
  );
}

export function getTrace(
  client: ManagementApiClient,
  node: string,
  vhost: string,
  name: string,
) {
  return client.request(tracePath(node, vhost, name), traceSchema);
}

export async function createTrace(
  client: ManagementApiClient,
  node: string,
  vhost: string,
  name: string,
  body: TraceBody,
) {
  await client.requestVoid(tracePath(node, vhost, name), {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteTrace(
  client: ManagementApiClient,
  node: string,
  vhost: string,
  name: string,
) {
  await client.requestVoid(tracePath(node, vhost, name), { method: "DELETE" });
}

export function getTraceFiles(client: ManagementApiClient, node: string) {
  return client.request(
    nodePath("/trace-files", node),
    z.array(traceFileSchema),
  );
}

export async function deleteTraceFile(
  client: ManagementApiClient,
  node: string,
  name: string,
) {
  await client.requestVoid(
    `${nodePath("/trace-files", node)}/${encodeURIComponent(name)}`,
    { method: "DELETE" },
  );
}

export function traceFilePath(node: string, name: string) {
  return `${nodePath("/trace-files", node)}/${encodeURIComponent(name)}`;
}
