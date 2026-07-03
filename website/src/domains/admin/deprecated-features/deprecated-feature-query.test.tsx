import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDeprecatedFeatures } from "./deprecated-feature-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { deprecatedFeatureApi } from "./deprecated-feature-api";
import { ManagementApiClient } from "@/api/management-api-client";
import { mockDeprecatedFeatures } from "@/test/fixtures/feature-flags";

vi.mock("./deprecated-feature-api", () => ({
  deprecatedFeatureApi: {
    getDeprecatedFeatures: vi.fn(),
  },
}));

describe("deprecated feature queries", () => {
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

  it("useDeprecatedFeatures fetches features", async () => {
    vi.mocked(deprecatedFeatureApi.getDeprecatedFeatures).mockResolvedValueOnce(mockDeprecatedFeatures);
    const { result } = renderHook(() => useDeprecatedFeatures(apiClient), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockDeprecatedFeatures);
  });
});
