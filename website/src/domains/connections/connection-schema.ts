import { z } from "zod";

const rateSampleSchema = z.object({
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

export const connectionSchema = z
  .object({
    name: z.string(),
    node: z.string().optional(),
    vhost: z.string().optional(),
    user: z.string().optional(),
    protocol: z.string().optional(),
    state: z.string().optional(),
    ssl: z.boolean().optional(),
    ssl_protocol: z.string().nullish(),
    ssl_hash: z.string().nullish(),
    ssl_cipher: z.string().nullish(),
    peer_host: z.string().optional(),
    peer_port: z.number().optional(),
    host: z.string().optional(),
    port: z.number().optional(),
    connected_at: z.number().optional(),
    channels: z.number().optional(),
    send_oct: z.number().optional(),
    recv_oct: z.number().optional(),
    send_oct_details: rateDetailsSchema,
    recv_oct_details: rateDetailsSchema,
    client_properties: z.record(z.string(), z.unknown()).optional(),
    auth_mechanism: z.string().optional(),
    timeout: z.number().optional(),
    frame_max: z.number().optional(),
    channel_max: z.number().optional(),
    type: z.string().optional(),
  })
  .passthrough();

export type Connection = z.infer<typeof connectionSchema>;
