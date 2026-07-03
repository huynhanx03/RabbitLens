import * as z from "zod";

export const policySchema = z.object({
  vhost: z.string(),
  name: z.string(),
  pattern: z.string(),
  "apply-to": z.enum(["all", "exchanges", "queues"]),
  definition: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  priority: z.number(),
}).catchall(z.unknown());

export type PolicyResponse = z.infer<typeof policySchema>;

export const policyBodySchema = z.object({
  pattern: z.string(),
  "apply-to": z.enum(["all", "exchanges", "queues"]),
  definition: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  priority: z.number().optional(),
});

export type PolicyBody = z.infer<typeof policyBodySchema>;
