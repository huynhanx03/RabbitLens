import { z } from "zod";

const queueIdentitySchema = z
  .object({
    name: z.string(),
    vhost: z.string(),
  })
  .passthrough();

const ownerSchema = z
  .object({
    name: z.string().optional(),
    connection_name: z.string().optional(),
  })
  .passthrough();

export const consumerSchema = z
  .object({
    consumer_tag: z.string(),
    queue: queueIdentitySchema,
    channel_details: ownerSchema.optional(),
    ack_required: z.boolean().nullish(),
    exclusive: z.boolean().nullish(),
    prefetch_count: z.number().nullish(),
    active: z.boolean().nullish(),
    activity_status: z.string().nullish(),
    consumer_timeout: z.number().nullish(),
    arguments: z.record(z.string(), z.unknown()).nullish(),
  })
  .passthrough();

export const consumersSchema = z.array(consumerSchema);
export type Consumer = z.infer<typeof consumerSchema>;
