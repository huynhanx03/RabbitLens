import { describe, expect, it, vi } from "vitest";

import type { ManagementApiClient } from "@/api/management-api-client";
import { CHART_RANGES, type ChartRange } from "@/config/chart-ranges";
import { PRODUCT_DEFAULTS } from "@/config/defaults";

type QueueDetailQueryFactory = (
  apiClient: ManagementApiClient,
  vhost: string,
  name: string,
  range: ChartRange,
) => {
  queryKey: readonly unknown[];
  staleTime?: number;
  queryFn?: (context: { signal: AbortSignal }) => Promise<unknown>;
};

describe("queueDetailQueryOptions", () => {
  it("uses one stable key and requests count history only", async () => {
    const queueQueryModule = await import("./queue-query");
    const factory = (
      queueQueryModule as unknown as {
        queueDetailQueryOptions?: QueueDetailQueryFactory;
      }
    ).queueDetailQueryOptions;

    expect(factory).toBeTypeOf("function");
    if (!factory) return;

    const request = vi.fn().mockResolvedValue({ name: "orders" });
    const apiClient = { request } as unknown as ManagementApiClient;
    const first = factory(apiClient, "/", "orders", CHART_RANGES[0]);
    const second = factory(apiClient, "/", "orders", CHART_RANGES[0]);

    expect(first.queryKey).toEqual(second.queryKey);
    expect(first.staleTime).toBe(PRODUCT_DEFAULTS.polling.nodeDetailsMs);
    expect(first.queryFn).toBeTypeOf("function");

    const signal = new AbortController().signal;
    await first.queryFn?.({ signal });

    expect(request).toHaveBeenCalledWith(
      "/queues/%2F/orders?lengths_age=60&lengths_incr=5",
      expect.anything(),
      { signal },
    );
  });
});
