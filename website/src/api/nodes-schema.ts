import { z } from "zod";

const metricDetailsSchema = z
  .object({
    rate: z.number(),
    samples: z.array(z.object({ timestamp: z.number(), sample: z.number() })).optional(),
  })
  .passthrough()
  .optional();

export const nodeSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  running: z.boolean().optional(),
  mem_alarm: z.boolean().optional(),
  disk_free_alarm: z.boolean().optional(),
  partitions: z.array(z.string()).optional(),
  uptime: z.number().optional(),
  fd_used: z.number().optional(),
  fd_total: z.number().optional(),
  sockets_used: z.number().optional(),
  sockets_total: z.number().optional(),
  mem_used: z.number().optional(),
  mem_limit: z.number().optional(),
  disk_free: z.number().optional(),
  disk_free_limit: z.number().optional(),
  proc_used: z.number().optional(),
  proc_total: z.number().optional(),
  memory: z.unknown().optional(),
  binary: z.unknown().optional(),
  os_pid: z.union([z.string(), z.number()]).optional(),
  rates_mode: z.string().optional(),
  net_ticktime: z.number().optional(),
  run_queue: z.number().optional(),
  processors: z.number().optional(),
  applications: z
    .array(
      z
        .object({
          name: z.string(),
          version: z.string().optional(),
          description: z.string().optional(),
        })
        .passthrough(),
    )
    .optional(),
  enabled_plugins: z.array(z.string()).optional(),
  config_files: z.array(z.string()).optional(),
  log_files: z.array(z.string()).optional(),
  cluster_links: z.unknown().optional(),
  mnesia_ram_tx_count: z.number().optional(),
  mnesia_disk_tx_count: z.number().optional(),
  queue_index_journal_write_count: z.number().optional(),
  queue_index_read_count: z.number().optional(),
  queue_index_write_count: z.number().optional(),
  msg_store_read_count: z.number().optional(),
  msg_store_write_count: z.number().optional(),
  io_read_count: z.number().optional(),
  io_write_count: z.number().optional(),
  io_seek_count: z.number().optional(),
  io_sync_count: z.number().optional(),
  io_reopen_count: z.number().optional(),
  io_read_bytes: z.number().optional(),
  io_write_bytes: z.number().optional(),
  io_read_avg_time: z.number().optional(),
  io_write_avg_time: z.number().optional(),
  io_seek_avg_time: z.number().optional(),
  io_sync_avg_time: z.number().optional(),
  io_read_details: metricDetailsSchema,
  io_write_details: metricDetailsSchema,
  connection_created: z.number().optional(),
  connection_closed: z.number().optional(),
  channel_created: z.number().optional(),
  channel_closed: z.number().optional(),
  queue_declared: z.number().optional(),
  queue_created: z.number().optional(),
  queue_deleted: z.number().optional(),
}).passthrough();

export const nodesSchema = z.array(nodeSchema);

export type NodeResponse = z.infer<typeof nodeSchema>;
