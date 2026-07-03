import { z } from "zod";

export const rateSampleSchema = z.object({
  timestamp: z.number(),
  sample: z.number(),
});

const rateDetailsSchema = z
  .object({
    rate: z.number(),
    samples: z.array(rateSampleSchema).optional(),
  })
  .passthrough()
  .optional();

export const queueSchema = z
  .object({
    name: z.string(),
    vhost: z.string().optional(),
    node: z.string().optional(),
    type: z.string().optional(), // 'classic', 'quorum', 'stream'
    state: z.string().optional(),
    durable: z.boolean().optional(),
    auto_delete: z.boolean().optional(),
    exclusive: z.boolean().optional(),
    arguments: z.record(z.string(), z.unknown()).optional(),
    messages: z.number().optional(),
    messages_ready: z.number().optional(),
    messages_unacknowledged: z.number().optional(),
    messages_details: rateDetailsSchema,
    messages_ready_details: rateDetailsSchema,
    messages_unacknowledged_details: rateDetailsSchema,
    consumers: z.number().optional(),
    consumer_utilisation: z.number().optional(),
    idle_since: z.string().optional(),
    memory: z.number().optional(),
    message_bytes: z.number().optional(),
    message_stats: z
      .object({
        publish: z.number().optional(),
        publish_details: rateDetailsSchema,
        deliver: z.number().optional(),
        deliver_details: rateDetailsSchema,
        deliver_get: z.number().optional(),
        deliver_get_details: rateDetailsSchema,
        redeliver: z.number().optional(),
        redeliver_details: rateDetailsSchema,
        ack: z.number().optional(),
        ack_details: rateDetailsSchema,
      })
      .passthrough()
      .optional(),
    backing_queue_status: z
      .object({
        mode: z.string().optional(),
        target_ram_count: z.union([z.number(), z.string()]).optional(), // Sometimes 'infinity'
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type Queue = z.infer<typeof queueSchema>;

export const messageResponseSchema = z
  .object({
    payload_bytes: z.number(),
    redelivered: z.boolean(),
    exchange: z.string(),
    routing_key: z.string(),
    message_count: z.number(),
    properties: z.record(z.string(), z.unknown()),
    payload: z.string(),
    payload_encoding: z.string(),
  })
  .passthrough();

export const messageResponseListSchema = z.array(messageResponseSchema);

export type MessageResponse = z.infer<typeof messageResponseSchema>;
