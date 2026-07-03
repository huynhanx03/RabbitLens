import * as z from "zod";
import { messageStatsSchema } from "@/domains/overview/overview-schema";

export const vhostClusterStateSchema = z.record(z.string(), z.enum(["running", "stopped", "partial"]));

export const vhostSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  default_queue_type: z.enum(["classic", "quorum", "stream"]).optional(),
  tracing: z.boolean().optional(),
  cluster_state: vhostClusterStateSchema.optional(),
  message_stats: messageStatsSchema.optional(),
  messages: z.number().optional(),
  messages_ready: z.number().optional(),
  messages_unacknowledged: z.number().optional(),
  recv_oct: z.number().optional(),
  send_oct: z.number().optional(),
  recv_oct_details: z.object({ rate: z.number() }).optional(),
  send_oct_details: z.object({ rate: z.number() }).optional(),
}).catchall(z.unknown());

export type VhostResponse = z.infer<typeof vhostSchema>;

export const vhostBodySchema = z.object({
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  default_queue_type: z.enum(["classic", "quorum", "stream"]).optional(),
  tracing: z.boolean().optional(),
});

export type VhostBody = z.infer<typeof vhostBodySchema>;
