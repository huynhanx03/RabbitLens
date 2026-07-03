import { describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import { capabilityKeys } from "@/capabilities/capability-queries";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { overviewQueryOptions } from "./overview-query";

describe("overviewQueryOptions", () => {
  it("shares the capability overview key and active polling policy", () => {
    const client = {} as ManagementApiClient;
    const options = overviewQueryOptions(client, () => true);

    expect(options.queryKey).toEqual(capabilityKeys.overview());
    expect(options.staleTime).toBe(PRODUCT_DEFAULTS.polling.overviewMs);
    expect(options.refetchInterval).toBeTypeOf("function");
    expect(vi.isMockFunction(options.queryFn)).toBe(false);
  });
});
