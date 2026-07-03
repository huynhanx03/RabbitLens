import { z } from "zod";

export const rateDetailsSchema = z.object({
  rate: z.number(),
}).passthrough();

export const messageStatsSchema = z.object({
  publish: z.number().optional(),
  publish_details: rateDetailsSchema.optional(),
  deliver_get: z.number().optional(),
  deliver_get_details: rateDetailsSchema.optional(),
  ack: z.number().optional(),
  ack_details: rateDetailsSchema.optional(),
}).passthrough();

export const objectTotalsSchema = z.object({
  connections: z.number(),
  channels: z.number(),
  exchanges: z.number(),
  queues: z.number(),
  consumers: z.number(),
}).passthrough();

export const queueTotalsSchema = z
  .object({
    messages: z.number().optional(),
    messages_ready: z.number().optional(),
    messages_unacknowledged: z.number().optional(),
  })
  .passthrough();

export const overviewSchema = z.object({
  rabbitmq_version: z.string(),
  erlang_version: z.string(),
  management_version: z.string(),
  cluster_name: z.string(),
  disable_stats: z.boolean().default(false),
  enable_queue_totals: z.boolean().default(false).optional(),
  rates_mode: z.enum(["none", "basic", "detailed"]).optional(),
  object_totals: objectTotalsSchema.optional(),
  queue_totals: queueTotalsSchema.optional(),
  message_stats: messageStatsSchema.optional(),
}).passthrough();

export type OverviewResponse = z.infer<typeof overviewSchema>;
