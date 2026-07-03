import * as z from "zod";

export const deprecatedFeatureSchema = z.object({
  name: z.string(),
  desc: z.string(),
  docs_url: z.string().optional(),
}).catchall(z.unknown());

export type DeprecatedFeatureResponse = z.infer<typeof deprecatedFeatureSchema>;
