import { describe, expect, it, vi } from "vitest";

import type { ManagementApiClient } from "@/api/management-api-client";
import { CHART_RANGES, type ChartRange } from "@/config/chart-ranges";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import * as exchangeQueryModule from "./exchange-query";

type ExchangeConfigQueryFactory = (
  apiClient: ManagementApiClient,
  vhost: string,
  exchange: string,
) => {
  queryKey: readonly unknown[];
  staleTime?: number;
  queryFn?: (context: { signal: AbortSignal }) => Promise<unknown>;
};

type ExchangeDetailQueryFactory = (
  apiClient: ManagementApiClient,
  vhost: string,
  exchange: string,
  range: ChartRange,
) => {
  queryKey: readonly unknown[];
  staleTime?: number;
  refetchInterval?: unknown;
  queryFn?: (context: { signal: AbortSignal }) => Promise<unknown>;
};

describe("exchangeConfigQueryOptions", () => {
  it("requests declaration data without statistics", async () => {
    const factory = (
      exchangeQueryModule as unknown as {
        exchangeConfigQueryOptions?: ExchangeConfigQueryFactory;
      }
    ).exchangeConfigQueryOptions;

    expect(factory).toBeTypeOf("function");
    if (!factory) return;

    const request = vi.fn().mockResolvedValue({ name: "pentest.response" });
    const apiClient = { request } as unknown as ManagementApiClient;
    const options = factory(apiClient, "/", "pentest.response");
    const signal = new AbortController().signal;

    expect(options.queryKey).toEqual([
      "exchanges",
      "detail",
      "/",
      "pentest.response",
      "configuration",
    ]);
    expect(options.staleTime).toBe(60_000);
    await options.queryFn?.({ signal });
    expect(request).toHaveBeenCalledWith(
      "/exchanges/%2F/pentest.response?disable_stats=true",
      expect.anything(),
      { signal },
    );
  });

  it("shares a stable message-rate query across loaders and pages", async () => {
    const factory = (
      exchangeQueryModule as unknown as {
        exchangeDetailQueryOptions?: ExchangeDetailQueryFactory;
      }
    ).exchangeDetailQueryOptions;

    expect(factory).toBeTypeOf("function");
    if (!factory) return;

    const request = vi.fn().mockResolvedValue({ name: "orders.events" });
    const apiClient = { request } as unknown as ManagementApiClient;
    const first = factory(apiClient, "/", "orders.events", CHART_RANGES[0]);
    const second = factory(apiClient, "/", "orders.events", CHART_RANGES[0]);
    const signal = new AbortController().signal;

    expect(first.queryKey).toEqual([
      "exchanges",
      "detail",
      "/",
      "orders.events",
      "message-rates",
      60,
      5,
    ]);
    expect(first.queryKey).toEqual(second.queryKey);
    expect(first.staleTime).toBe(PRODUCT_DEFAULTS.polling.nodeDetailsMs);
    expect(first.refetchInterval).toBeTypeOf("function");

    await first.queryFn?.({ signal });
    expect(request).toHaveBeenCalledWith(
      "/exchanges/%2F/orders.events?msg_rates_age=60&msg_rates_incr=5",
      expect.anything(),
      { signal },
    );
  });
});
