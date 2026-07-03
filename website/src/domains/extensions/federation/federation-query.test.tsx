import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFederationLinks } from "./federation-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { federationApi } from "./federation-api";
import { ManagementApiClient } from "@/api/management-api-client";
import { mockFederationLinks } from "@/test/fixtures/extensions/federation";

vi.mock("./federation-api", () => ({
  federationApi: {
    getFederationLinks: vi.fn(),
  },
}));

describe("federation queries", () => {
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

  it("useFederationLinks fetches links", async () => {
    vi.mocked(federationApi.getFederationLinks).mockResolvedValueOnce(mockFederationLinks);
    const { result } = renderHook(() => useFederationLinks(apiClient), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockFederationLinks);
  });
});
