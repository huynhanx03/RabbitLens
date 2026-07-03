import * as z from "zod";

export const shovelStatusSchema = z.object({
  vhost: z.string(),
  name: z.string(),
  node: z.string(),
  type: z.enum(["dynamic", "static"]).or(z.string()),
  state: z.enum(["running", "starting", "terminated"]).or(z.string()),
  src_uri: z.string(),
  dest_uri: z.string(),
  timestamp: z.string(),
  error: z.string().optional(),
}).catchall(z.unknown());

export type ShovelStatusResponse = z.infer<typeof shovelStatusSchema>;
