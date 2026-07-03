import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import {
  deleteShovel,
  getShovelParameter,
  getShovelParameters,
  putShovelParameter,
  restartShovel,
} from "./shovel-parameter-api";

describe("dynamic shovel API", () => {
  let client: ManagementApiClient;

  beforeEach(() => {
    client = {
      request: vi.fn(),
      requestVoid: vi.fn(),
    } as unknown as ManagementApiClient;
  });

  it("reads all parameters and one encoded parameter", async () => {
    vi.mocked(client.request).mockResolvedValue([]);
    await getShovelParameters(client);
    await getShovelParameter(client, "/", "move orders");

    expect(client.request).toHaveBeenNthCalledWith(
      1,
      "/parameters/shovel",
      expect.any(Object),
    );
    expect(client.request).toHaveBeenNthCalledWith(
      2,
      "/parameters/shovel/%2F/move%20orders",
      expect.any(Object),
    );
  });

  it("saves, deletes, and restarts using legacy plugin paths", async () => {
    const value = { "src-uri": "amqp://source", "dest-uri": "amqp://dest" };
    await putShovelParameter(client, "/", "move", value);
    await deleteShovel(client, "/", "move");
    await restartShovel(client, "/", "move");

    expect(client.requestVoid).toHaveBeenNthCalledWith(
      1,
      "/parameters/shovel/%2F/move",
      { method: "PUT", body: JSON.stringify({ value }) },
    );
    expect(client.requestVoid).toHaveBeenNthCalledWith(
      2,
      "/shovels/vhost/%2F/move",
      { method: "DELETE" },
    );
    expect(client.requestVoid).toHaveBeenNthCalledWith(
      3,
      "/shovels/vhost/%2F/move/restart",
      { method: "DELETE" },
    );
  });
});
