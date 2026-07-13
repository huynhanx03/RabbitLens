import { describe, expect, it, vi } from "vitest";

import type { ManagementApiClient } from "@/api/management-api-client";
import { CHART_RANGES } from "@/config/chart-ranges";
import { queueDetailQueryOptions } from "@/domains/queues/queue-query";
import { Route } from "./$vhost.$name";

type DetailLoader = (args: {
  context: {
    apiClient: ManagementApiClient;
    queryClient: { ensureQueryData: (options: unknown) => Promise<unknown> };
  };
  params: { vhost: string; name: string };
}) => Promise<unknown>;

describe("Queue detail loader", () => {
  it("prefetches the same query identity used by Queue Detail", async () => {
    const ensureQueryData = vi.fn().mockResolvedValue({ name: "orders" });
    const apiClient = { request: vi.fn() } as unknown as ManagementApiClient;
    const loader = Route.options.loader as unknown as DetailLoader;

    await loader({
      context: { apiClient, queryClient: { ensureQueryData } },
      params: { vhost: "/", name: "orders" },
    });

    expect(ensureQueryData).toHaveBeenCalledTimes(1);
    expect(ensureQueryData).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: queueDetailQueryOptions(
          apiClient,
          "/",
          "orders",
          CHART_RANGES[0],
        ).queryKey,
      }),
    );
  });
});
