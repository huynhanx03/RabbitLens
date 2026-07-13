import { describe, expect, it, vi } from "vitest";

import type { ManagementApiClient } from "@/api/management-api-client";
import * as bindingQueryModule from "./binding-query";

type QueueBindingsQueryFactory = (
  apiClient: ManagementApiClient,
  vhost: string,
  queue: string,
) => {
  queryKey: readonly unknown[];
  queryFn?: (context: { signal: AbortSignal }) => Promise<unknown>;
};

describe("queueBindingsQueryOptions", () => {
  it("uses the queue binding key and encoded endpoint", async () => {
    const factory = (
      bindingQueryModule as unknown as {
        queueBindingsQueryOptions?: QueueBindingsQueryFactory;
      }
    ).queueBindingsQueryOptions;

    expect(factory).toBeTypeOf("function");
    if (!factory) return;

    const request = vi.fn().mockResolvedValue([]);
    const apiClient = { request } as unknown as ManagementApiClient;
    const options = factory(apiClient, "/production", "pentest.response");
    const signal = new AbortController().signal;

    expect(options.queryKey).toEqual([
      "bindings",
      "queue",
      "/production",
      "pentest.response",
    ]);
    await options.queryFn?.({ signal });
    expect(request).toHaveBeenCalledWith(
      "/queues/%2Fproduction/pentest.response/bindings",
      expect.anything(),
      { signal },
    );
  });
});
