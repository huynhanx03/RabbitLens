import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import {
  deleteUserLimit,
  deleteVhostLimit,
  getUserLimits,
  getVhostLimits,
  putUserLimit,
  putVhostLimit,
} from "./limit-api";

describe("limit API", () => {
  let client: ManagementApiClient;

  beforeEach(() => {
    client = {
      request: vi.fn(),
      requestVoid: vi.fn(),
    } as unknown as ManagementApiClient;
  });

  it("reads vhost and user limits", async () => {
    vi.mocked(client.request).mockResolvedValue([]);

    await getVhostLimits(client);
    await getUserLimits(client);

    expect(client.request).toHaveBeenNthCalledWith(
      1,
      "/vhost-limits",
      expect.any(Object),
    );
    expect(client.request).toHaveBeenNthCalledWith(
      2,
      "/user-limits",
      expect.any(Object),
    );
  });

  it("uses encoded vhost limit paths", async () => {
    await putVhostLimit(client, "/", "max-connections", 12);
    await deleteVhostLimit(client, "/", "max-connections");

    expect(client.requestVoid).toHaveBeenNthCalledWith(
      1,
      "/vhost-limits/%2F/max-connections",
      { method: "PUT", body: JSON.stringify({ value: 12 }) },
    );
    expect(client.requestVoid).toHaveBeenNthCalledWith(
      2,
      "/vhost-limits/%2F/max-connections",
      { method: "DELETE" },
    );
  });

  it("uses encoded user limit paths", async () => {
    await putUserLimit(client, "service user", "max-connections", 8);
    await deleteUserLimit(client, "service user", "max-connections");

    expect(client.requestVoid).toHaveBeenNthCalledWith(
      1,
      "/user-limits/service%20user/max-connections",
      { method: "PUT", body: JSON.stringify({ value: 8 }) },
    );
    expect(client.requestVoid).toHaveBeenNthCalledWith(
      2,
      "/user-limits/service%20user/max-connections",
      { method: "DELETE" },
    );
  });
});
