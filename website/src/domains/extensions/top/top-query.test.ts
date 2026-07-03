import { describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import {
  etsTablesQueryOptions,
  processDetailQueryOptions,
  topProcessesQueryOptions,
} from "./top-query";
import * as api from "./top-api";

vi.mock("./top-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./top-api")>()),
  getEtsTables: vi.fn(),
  getProcess: vi.fn(),
  getTopProcesses: vi.fn(),
}));

describe("Top queries", () => {
  const client = {} as ManagementApiClient;

  it("keeps node and row count in collection query keys", async () => {
    vi.mocked(api.getTopProcesses).mockResolvedValue({
      node: "rabbit@node",
      row_count: 50,
      processes: [],
    });
    vi.mocked(api.getEtsTables).mockResolvedValue({
      node: "rabbit@node",
      row_count: 100,
      ets_tables: [],
    });

    const processes = topProcessesQueryOptions(client, "rabbit@node", 50);
    const tables = etsTablesQueryOptions(client, "rabbit@node", 100);

    expect(processes.queryKey).toEqual(["top", "processes", "rabbit@node", 50]);
    expect(tables.queryKey).toEqual(["top", "ets", "rabbit@node", 100]);
  });

  it("keys process detail by PID", () => {
    expect(processDetailQueryOptions(client, "<0.1.0>").queryKey).toEqual([
      "top",
      "process",
      "<0.1.0>",
    ]);
  });
});
