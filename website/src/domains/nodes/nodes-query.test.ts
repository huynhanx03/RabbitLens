import { describe, expect, it } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import {
  nodeBinaryQueryOptions,
  nodesKeys,
  nodesListQueryOptions,
} from "@/domains/nodes/nodes-query";

describe("nodes query options", () => {
  const client = {} as ManagementApiClient;

  it("uses stable list and detail keys", () => {
    expect(nodesKeys.list()).toEqual(["nodes", "list"]);
    expect(nodesKeys.detail("rabbit@one")).toEqual([
      "nodes",
      "detail",
      "rabbit@one",
    ]);
    expect(nodesListQueryOptions(client, () => true).queryKey).toEqual(
      nodesKeys.list(),
    );
  });

  it("keeps binary memory disabled until explicitly enabled", () => {
    expect(nodeBinaryQueryOptions(client, "rabbit@one", false).enabled).toBe(
      false,
    );
    expect(nodeBinaryQueryOptions(client, "rabbit@one", true).enabled).toBe(
      true,
    );
  });
});
