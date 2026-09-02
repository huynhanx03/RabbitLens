import { describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import { getWhoAmI } from "./whoami-api";

describe("getWhoAmI", () => {
  it("requests the authenticated RabbitMQ identity through the validated endpoint", async () => {
    const client = {
      request: vi.fn().mockResolvedValue({
        name: "operator",
        tags: ["administrator"],
        is_internal_user: true,
        login_session_timeout: 30,
      }),
    } as unknown as ManagementApiClient;

    await expect(getWhoAmI(client)).resolves.toEqual({
      name: "operator",
      tags: ["administrator"],
      loginSessionTimeoutMinutes: 30,
    });
    expect(client.request).toHaveBeenCalledWith("/whoami", expect.any(Object));
  });

  it("preserves an absent server timeout as an optional session policy", async () => {
    const client = {
      request: vi.fn().mockResolvedValue({ name: "monitor", tags: ["monitoring"] }),
    } as unknown as ManagementApiClient;

    await expect(getWhoAmI(client)).resolves.toEqual({
      name: "monitor",
      tags: ["monitoring"],
      loginSessionTimeoutMinutes: undefined,
    });
  });
});
