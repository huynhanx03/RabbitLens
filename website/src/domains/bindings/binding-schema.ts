import { z } from "zod";

export const bindingSchema = z.object({
  source: z.string(),
  vhost: z.string(),
  destination: z.string(),
  destination_type: z.enum(["queue", "exchange"]),
  routing_key: z.string(),
  arguments: z.record(z.string(), z.unknown()),
  properties_key: z.string(),
});

export type Binding = z.infer<typeof bindingSchema>;
