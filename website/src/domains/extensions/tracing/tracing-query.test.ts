import { describe, expect, it } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import {
  traceDetailQueryOptions,
  traceFilesQueryOptions,
  tracesQueryOptions,
} from "./tracing-query";

describe("Tracing queries", () => {
  const client = {} as ManagementApiClient;

  it("keys trace collections by node", () => {
    expect(tracesQueryOptions(client, "rabbit@node").queryKey).toEqual([
      "tracing",
      "traces",
      "rabbit@node",
    ]);
    expect(traceFilesQueryOptions(client, "rabbit@node").queryKey).toEqual([
      "tracing",
      "files",
      "rabbit@node",
    ]);
  });

  it("keys details by node, vhost, and name", () => {
    expect(
      traceDetailQueryOptions(client, "rabbit@node", "/", "audit").queryKey,
    ).toEqual(["tracing", "trace", "rabbit@node", "/", "audit"]);
  });
});
