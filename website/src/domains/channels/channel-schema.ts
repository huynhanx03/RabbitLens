import { z } from "zod";
import { consumerSchema } from "@/domains/consumers/consumer-schema";

const rateDetailsSchema = z
  .object({
    rate: z.number(),
  })
  .passthrough()
  .optional();

export const channelSchema = z
  .object({
    name: z.string(),
    node: z.string().optional(),
    connection_details: z
      .object({
        name: z.string(),
        peer_host: z.string(),
        peer_port: z.union([z.number(), z.literal("undefined")]),
      })
      .passthrough()
      .optional(),
    user: z.string().optional(),
    vhost: z.string().optional(),
    number: z.number().optional(),
    state: z.string().optional(),
    idle_since: z.string().optional(),
    transactional: z.boolean().optional(),
    confirm: z.boolean().optional(),
    consumer_count: z.number().optional(),
    messages_unacknowledged: z.number().optional(),
    messages_unconfirmed: z.number().optional(),
    messages_uncommitted: z.number().optional(),
    acks_uncommitted: z.number().optional(),
    prefetch_count: z.number().optional(),
    global_prefetch_count: z.number().nullable().optional(),
    pending_raft_commands: z.number().nullish(),
    cached_segments: z.number().nullish(),
    consumer_details: z.array(consumerSchema).optional(),
    message_stats: z
      .object({
        publish: z.number().optional(),
        publish_details: rateDetailsSchema,
        confirm: z.number().optional(),
        confirm_details: rateDetailsSchema,
        return_unroutable: z.number().optional(),
        return_unroutable_details: rateDetailsSchema,
        deliver: z.number().optional(),
        deliver_details: rateDetailsSchema,
        deliver_get: z.number().optional(),
        deliver_get_details: rateDetailsSchema,
        get: z.number().optional(),
        get_details: rateDetailsSchema,
        get_no_ack: z.number().optional(),
        get_no_ack_details: rateDetailsSchema,
        ack: z.number().optional(),
        ack_details: rateDetailsSchema,
        redeliver: z.number().optional(),
        redeliver_details: rateDetailsSchema,
        drop_unroutable: z.number().optional(),
        drop_unroutable_details: rateDetailsSchema,
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

export type Channel = z.infer<typeof channelSchema>;
