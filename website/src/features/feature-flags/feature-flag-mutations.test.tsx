import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { featureFlagApi } from "@/domains/admin/feature-flags/feature-flag-api";
import { featureFlagKeys } from "@/domains/admin/feature-flags/feature-flag-query";
import { useEnableFeatureFlagMutation } from "./feature-flag-mutations";

vi.mock("@/domains/admin/feature-flags/feature-flag-api", () => ({
  featureFlagApi: { enableFeatureFlag: vi.fn() },
}));

describe("useEnableFeatureFlagMutation", () => {
  it("enables the requested irreversible flag then refreshes the flag list", async () => {
    vi.mocked(featureFlagApi.enableFeatureFlag).mockResolvedValue(undefined);
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const client = {} as ManagementApiClient;
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useEnableFeatureFlagMutation(client), { wrapper });

    await result.current.mutateAsync("quorum_queue");

    expect(featureFlagApi.enableFeatureFlag).toHaveBeenCalledWith(client, "quorum_queue");
    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: featureFlagKeys.lists() }),
    );
  });
});
