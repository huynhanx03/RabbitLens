import { z } from "zod";

export const whoAmISchema = z.object({
  name: z.string(),
  tags: z.array(z.string()).readonly(),
  is_internal_user: z.boolean().optional(),
  login_session_timeout: z.number().positive().optional(),
}).passthrough();

export type WhoAmI = z.infer<typeof whoAmISchema>;
