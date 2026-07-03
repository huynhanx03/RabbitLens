import { z } from "zod";
import type { ManagementApiClient } from "@/api/management-api-client";

const processNameSchema = z
  .object({
    name: z.string().optional(),
    type: z.string().optional(),
    supertype: z.string().optional(),
    connection_name: z.string().optional(),
    channel_number: z.number().optional(),
    vhost: z.string().optional(),
    queue_name: z.string().optional(),
  })
  .passthrough();

export const topProcessSchema = z
  .object({
    pid: z.string(),
    name: processNameSchema,
    memory: z.number(),
    reduction_delta: z.number().optional(),
    reductions: z.number(),
    message_queue_len: z.number(),
    buffer_len: z.number().optional(),
    status: z.string().optional(),
  })
  .passthrough();

export const topProcessesSchema = z.object({
  node: z.string(),
  row_count: z.number(),
  processes: z.array(topProcessSchema),
});

export const etsTableSchema = z
  .object({
    name: z.union([z.string(), z.number()]),
    owner: z.string(),
    heir: z.string().optional(),
    memory: z.number(),
    size: z.number(),
    type: z.string(),
    named_table: z.boolean().optional(),
    protection: z.string().optional(),
    compressed: z.boolean().optional(),
  })
  .passthrough();

export const etsTablesSchema = z.object({
  node: z.string(),
  row_count: z.number(),
  ets_tables: z.array(etsTableSchema),
});

export const processDetailSchema = topProcessSchema.extend({
  trap_exit: z.boolean().optional(),
  links: z.array(z.string()).optional(),
  monitors: z.array(z.string()).optional(),
  monitored_by: z.array(z.string()).optional(),
  current_stacktrace: z.unknown().optional(),
});

export type TopProcess = z.infer<typeof topProcessSchema>;
export type EtsTable = z.infer<typeof etsTableSchema>;
export type ProcessDetail = z.infer<typeof processDetailSchema>;

function collectionPath(prefix: string, node: string, rowCount: number) {
  return `${prefix}/${encodeURIComponent(node)}?row_count=${rowCount}`;
}

export function getTopProcesses(
  client: ManagementApiClient,
  node: string,
  rowCount: number,
) {
  return client.request(
    collectionPath("/top", node, rowCount),
    topProcessesSchema,
  );
}

export function getEtsTables(
  client: ManagementApiClient,
  node: string,
  rowCount: number,
) {
  return client.request(
    collectionPath("/top/ets", node, rowCount),
    etsTablesSchema,
  );
}

export function getProcess(client: ManagementApiClient, pid: string) {
  return client.request(
    `/process/${encodeURIComponent(pid)}`,
    processDetailSchema,
  );
}
