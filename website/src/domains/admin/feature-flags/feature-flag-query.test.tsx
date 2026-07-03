import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFeatureFlags } from "./feature-flag-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { featureFlagApi } from "./feature-flag-api";
import { ManagementApiClient } from "@/api/management-api-client";
import { mockFeatureFlags } from "@/test/fixtures/feature-flags";

vi.mock("./feature-flag-api", () => ({
  featureFlagApi: {
    getFeatureFlags: vi.fn(),
  },
}));

describe("feature flag queries", () => {
  let queryClient: QueryClient;
  let apiClient: ManagementApiClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    apiClient = {} as ManagementApiClient;
    vi.resetAllMocks();
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  it("useFeatureFlags fetches flags", async () => {
    vi.mocked(featureFlagApi.getFeatureFlags).mockResolvedValueOnce(mockFeatureFlags);
    const { result } = renderHook(() => useFeatureFlags(apiClient), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockFeatureFlags);
  });
});
