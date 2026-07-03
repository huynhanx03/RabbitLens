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

export const exchangeSchema = z
  .object({
    name: z.string(),
    vhost: z.string().optional(),
    type: z.string().optional(),
    durable: z.boolean().optional(),
    auto_delete: z.boolean().optional(),
    internal: z.boolean().optional(),
    arguments: z.record(z.string(), z.unknown()).optional(),
    message_stats: z
      .object({
        publish_in: z.number().optional(),
        publish_in_details: rateDetailsSchema,
        publish_out: z.number().optional(),
        publish_out_details: rateDetailsSchema,
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type Exchange = z.infer<typeof exchangeSchema>;
