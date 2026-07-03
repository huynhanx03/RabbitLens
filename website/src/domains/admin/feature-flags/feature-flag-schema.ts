import * as z from "zod";

export const featureFlagSchema = z.object({
  name: z.string(),
  desc: z.string(),
  state: z.string(),
  provided_by: z.string().optional(),
}).catchall(z.unknown());

export type FeatureFlagResponse = z.infer<typeof featureFlagSchema>;
