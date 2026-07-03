import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePolicies } from "./policy-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { policyApi } from "./policy-api";
import { ManagementApiClient } from "@/api/management-api-client";
import { mockPolicies } from "@/test/fixtures/policies";

vi.mock("./policy-api", () => ({
  policyApi: {
    getPolicies: vi.fn(),
  },
}));

describe("policy queries", () => {
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

  it("usePolicies fetches policies", async () => {
    vi.mocked(policyApi.getPolicies).mockResolvedValueOnce(mockPolicies);
    const { result } = renderHook(() => usePolicies(apiClient), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPolicies);
  });
});
