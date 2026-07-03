import * as z from "zod";

export const federationLinkSchema = z.object({
  vhost: z.string(),
  id: z.string(),
  node: z.string(),
  upstream: z.string(),
  exchange: z.string().optional(),
  queue: z.string().optional(),
  type: z.enum(["exchange", "queue"]).optional(),
  status: z.enum(["running", "starting", "error", "stopped", "shutdown"]).or(z.string()),
  local_connection: z.string().optional(),
  uri: z.string(),
  timestamp: z.string(),
  error: z.string().optional(),
}).catchall(z.unknown());

export type FederationLinkResponse = z.infer<typeof federationLinkSchema>;

// Helper to sanitize URI userinfo (passwords) for display
export function sanitizeFederationUri(uriString: string): string {
  try {
    const url = new URL(uriString);
    if (url.password) {
      url.password = "***";
    }
    return url.toString();
  } catch {
    // If it's not a valid URL (e.g. some AMQP connection string with multiple hosts or invalid format),
    // we use a regex to scrub the password.
    return uriString.replace(/\/\/([^:]+):[^@]+@/, "//$1:***@");
  }
}
