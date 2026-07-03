import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import { getEtsTables, getProcess, getTopProcesses } from "./top-api";

describe("Top API", () => {
  let client: ManagementApiClient;
  beforeEach(() => {
    client = { request: vi.fn() } as unknown as ManagementApiClient;
  });

  it("requests node-scoped process and ETS collections", async () => {
    vi.mocked(client.request).mockResolvedValue({});
    await getTopProcesses(client, "rabbit@node", 50);
    await getEtsTables(client, "rabbit@node", 100);

    expect(client.request).toHaveBeenNthCalledWith(
      1,
      "/top/rabbit%40node?row_count=50",
      expect.any(Object),
    );
    expect(client.request).toHaveBeenNthCalledWith(
      2,
      "/top/ets/rabbit%40node?row_count=100",
      expect.any(Object),
    );
  });

  it("requests one encoded process", async () => {
    vi.mocked(client.request).mockResolvedValue({});
    await getProcess(client, "<0.123.0>");
    expect(client.request).toHaveBeenCalledWith(
      "/process/%3C0.123.0%3E",
      expect.any(Object),
    );
  });
});
