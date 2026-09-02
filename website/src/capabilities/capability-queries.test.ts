import { describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import { getVisibleVhosts } from "./capability-api";
import { capabilityKeys, visibleVhostsQueryOptions } from "./capability-queries";

vi.mock("./capability-api", () => ({ getVisibleVhosts: vi.fn() }));

describe("capability query options", () => {
  it("keeps capability cache keys scoped and stable", () => {
    expect(capabilityKeys.all).toEqual(["capabilities"]);
    expect(capabilityKeys.overview()).toEqual(["capabilities", "overview"]);
    expect(capabilityKeys.extensions()).toEqual(["capabilities", "extensions"]);
    expect(capabilityKeys.vhosts()).toEqual(["capabilities", "vhosts"]);
  });

  it("loads visible vhosts once per session through the supplied client", async () => {
    const client = {} as ManagementApiClient;
    vi.mocked(getVisibleVhosts).mockResolvedValueOnce([{ name: "/" }]);
    const options = visibleVhostsQueryOptions(client);

    expect(options.queryKey).toEqual(["capabilities", "vhosts"]);
    expect(options.staleTime).toBe(Number.POSITIVE_INFINITY);
    await expect(options.queryFn?.({} as never)).resolves.toEqual([{ name: "/" }]);
    expect(getVisibleVhosts).toHaveBeenCalledWith(client);
  });
});
