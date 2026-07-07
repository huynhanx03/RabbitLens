import { z } from "zod";

const amqpScalarSchema = z.union([z.string(), z.number(), z.boolean()]);

const filterSchema = z
  .object({
    name: z.string(),
    descriptor: z.string().nullish(),
    value: z.unknown().optional(),
  })
  .passthrough();

export const incomingLinkSchema = z
  .object({
    handle: amqpScalarSchema.nullish(),
    link_name: z.string().nullish(),
    target_address: z.string().nullish(),
    snd_settle_mode: amqpScalarSchema.nullish(),
    max_message_size: amqpScalarSchema.nullish(),
    delivery_count: amqpScalarSchema.nullish(),
    credit: amqpScalarSchema.nullish(),
    unconfirmed_messages: amqpScalarSchema.nullish(),
  })
  .passthrough();

export const outgoingLinkSchema = z
  .object({
    handle: amqpScalarSchema.nullish(),
    link_name: z.string().nullish(),
    source_address: z.string().nullish(),
    queue_name: z.string().nullish(),
    send_settled: z.boolean().nullish(),
    max_message_size: amqpScalarSchema.nullish(),
    delivery_count: amqpScalarSchema.nullish(),
    credit: amqpScalarSchema.nullish(),
    consumer_timeout: z.boolean().nullish(),
    filter: z.array(filterSchema).nullish(),
  })
  .passthrough();

export const connectionSessionSchema = z
  .object({
    channel_number: amqpScalarSchema,
    handle_max: amqpScalarSchema.nullish(),
    next_incoming_id: amqpScalarSchema.nullish(),
    incoming_window: amqpScalarSchema.nullish(),
    next_outgoing_id: amqpScalarSchema.nullish(),
    remote_incoming_window: amqpScalarSchema.nullish(),
    remote_outgoing_window: amqpScalarSchema.nullish(),
    outgoing_unsettled_deliveries: amqpScalarSchema.nullish(),
    incoming_links: z.array(incomingLinkSchema).default([]),
    outgoing_links: z.array(outgoingLinkSchema).default([]),
  })
  .passthrough();

export const connectionSessionsSchema = z.array(connectionSessionSchema);

export type ConnectionSession = z.infer<typeof connectionSessionSchema>;
export type IncomingLink = z.infer<typeof incomingLinkSchema>;
export type OutgoingLink = z.infer<typeof outgoingLinkSchema>;
