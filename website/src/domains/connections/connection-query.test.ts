import { describe, expect, it, vi } from "vitest";

import type { ManagementApiClient } from "@/api/management-api-client";
import { CHART_RANGES, type ChartRange } from "@/config/chart-ranges";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import * as connectionQueryModule from "./connection-query";

type ConnectionDetailQueryFactory = (
  apiClient: ManagementApiClient,
  name: string,
  range: ChartRange,
) => {
  queryKey: readonly unknown[];
  refetchInterval?: unknown;
  queryFn?: (context: { signal: AbortSignal }) => Promise<unknown>;
};

describe("connectionDetailQueryOptions", () => {
  it("uses a stable range key and builds data-rate parameters", async () => {
    const factory = (
      connectionQueryModule as unknown as {
        connectionDetailQueryOptions?: ConnectionDetailQueryFactory;
      }
    ).connectionDetailQueryOptions;

    expect(factory).toBeTypeOf("function");
    if (!factory) return;

    const request = vi.fn().mockResolvedValue({ name: "client -> rabbit" });
    const apiClient = { request } as unknown as ManagementApiClient;
    const first = factory(apiClient, "client -> rabbit", CHART_RANGES[0]);
    const second = factory(apiClient, "client -> rabbit", CHART_RANGES[0]);
    const signal = new AbortController().signal;

    expect(first.queryKey).toEqual([
      "connections",
      "detail",
      "client -> rabbit",
      "data-rates",
      60,
      5,
    ]);
    expect(first.queryKey).toEqual(second.queryKey);
    expect(first.refetchInterval).toBeTypeOf("function");
    expect(
      (first.refetchInterval as () => number)(),
    ).toBe(PRODUCT_DEFAULTS.polling.nodeDetailsMs);

    await first.queryFn?.({ signal });
    expect(request).toHaveBeenCalledWith(
      "/connections/client%20-%3E%20rabbit?data_rates_age=60&data_rates_incr=5",
      expect.anything(),
      { signal },
    );
  });
});
