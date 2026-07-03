import { type ManagementApiClient } from "@/api/management-api-client";
import { apiPath } from "@/api/path";
import { whoAmISchema } from "./whoami-schema";
import { type AuthenticatedUser } from "./auth-session";

export async function getWhoAmI(client: ManagementApiClient): Promise<AuthenticatedUser> {
  const response = await client.request(apiPath("whoami"), whoAmISchema);
  return {
    name: response.name,
    tags: response.tags,
    loginSessionTimeoutMinutes: response.login_session_timeout,
  };
}
