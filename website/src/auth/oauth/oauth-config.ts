import * as z from "zod";

export const oauthResourceConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  authority: z.string().url(),
  metadataUrl: z.string().url().optional(),
  clientId: z.string().min(1),
  scopes: z.array(z.string()).min(1),
  resource: z.string().optional(),
  redirectUri: z.string().url(),
  silentRedirectUri: z.string().url().optional(),
  logoutUri: z.string().url().optional(),
}).strict(); // reject any unknown keys (like clientSecret)

export type OAuthResourceConfig = z.infer<typeof oauthResourceConfigSchema>;

export const oauthConfigSchema = z.object({
  resources: z.array(oauthResourceConfigSchema).min(1),
  defaultResourceId: z.string().optional(),
}).refine(data => {
  if (data.defaultResourceId) {
    return data.resources.some(r => r.id === data.defaultResourceId);
  }
  return true;
}, {
  message: "defaultResourceId must match a valid resource id",
  path: ["defaultResourceId"]
}).refine(data => {
  const ids = new Set(data.resources.map(r => r.id));
  return ids.size === data.resources.length;
}, {
  message: "resource ids must be unique",
  path: ["resources"]
});

export type OAuthConfig = z.infer<typeof oauthConfigSchema>;
