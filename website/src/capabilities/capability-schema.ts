import { z } from "zod";

export const visibleVhostSchema = z
  .object({
    name: z.string(),
  })
  .passthrough();

export const visibleVhostsSchema = z.array(visibleVhostSchema);

export type VisibleVhost = z.infer<typeof visibleVhostSchema>;
