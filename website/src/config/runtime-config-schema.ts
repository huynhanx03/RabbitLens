import { z } from "zod";

import { oauthConfigSchema } from "../auth/oauth/oauth-config";

const apiBaseUrlSchema = z.string().min(1).refine((value) => {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}, "apiBaseUrl must be an absolute path or HTTP(S) URL");

export const runtimeConfigSchema = z
  .object({
    apiBaseUrl: apiBaseUrlSchema,
    auth: z
      .object({
        basic: z.boolean(),
        oauth: oauthConfigSchema.nullable(),
      })
      .refine((auth) => auth.basic || auth.oauth !== null, {
        message: "At least one authentication method is required",
      }),
    defaultLocale: z.enum(["en", "vi"]),
    defaultTheme: z.enum(["light", "dark", "system"]),
  })
  .strict();

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;
