import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import {
  createTrace,
  deleteTrace,
  deleteTraceFile,
  getTrace,
  getTraceFiles,
  getTraces,
} from "./tracing-api";

describe("Tracing API", () => {
  let client: ManagementApiClient;

  beforeEach(() => {
    client = {
      request: vi.fn(),
      requestVoid: vi.fn(),
    } as unknown as ManagementApiClient;
  });

  it("uses node-scoped collection paths", async () => {
    vi.mocked(client.request).mockResolvedValue([]);
    await getTraces(client, "rabbit@node");
    await getTraceFiles(client, "rabbit@node");

    expect(client.request).toHaveBeenNthCalledWith(
      1,
      "/traces/node/rabbit%40node",
      expect.any(Object),
    );
    expect(client.request).toHaveBeenNthCalledWith(
      2,
      "/trace-files/node/rabbit%40node",
      expect.any(Object),
    );
  });

  it("uses the exact node, vhost, and name trace path", async () => {
    vi.mocked(client.request).mockResolvedValue({});
    await getTrace(client, "rabbit@node", "/", "audit trace");
    await createTrace(client, "rabbit@node", "/", "audit trace", {
      format: "json",
      pattern: "publish.#",
      max_payload_bytes: 4096,
    });
    await deleteTrace(client, "rabbit@node", "/", "audit trace");

    const path = "/traces/node/rabbit%40node/%2F/audit%20trace";
    expect(client.request).toHaveBeenCalledWith(path, expect.any(Object));
    expect(client.requestVoid).toHaveBeenNthCalledWith(1, path, {
      method: "PUT",
      body: JSON.stringify({
        format: "json",
        pattern: "publish.#",
        max_payload_bytes: 4096,
      }),
    });
    expect(client.requestVoid).toHaveBeenNthCalledWith(2, path, {
      method: "DELETE",
    });
  });

  it("deletes a file from its owning node", async () => {
    await deleteTraceFile(client, "rabbit@node", "audit.log");
    expect(client.requestVoid).toHaveBeenCalledWith(
      "/trace-files/node/rabbit%40node/audit.log",
      { method: "DELETE" },
    );
  });
});
