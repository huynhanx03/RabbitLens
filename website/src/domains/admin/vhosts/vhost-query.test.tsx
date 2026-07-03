import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useVhosts, useVhost } from "./vhost-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vhostApi } from "./vhost-api";
import { ManagementApiClient } from "@/api/management-api-client";
import { mockVhosts } from "@/test/fixtures/vhosts";

vi.mock("./vhost-api", () => ({
  vhostApi: {
    getVhosts: vi.fn(),
    getVhost: vi.fn(),
  },
}));

describe("vhost queries", () => {
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

  it("useVhosts fetches vhosts", async () => {
    vi.mocked(vhostApi.getVhosts).mockResolvedValueOnce(mockVhosts);
    const { result } = renderHook(() => useVhosts(apiClient), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockVhosts);
  });

  it("useVhost fetches specific vhost", async () => {
    vi.mocked(vhostApi.getVhost).mockResolvedValueOnce(mockVhosts[0]);
    const { result } = renderHook(() => useVhost(apiClient, "vhost-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockVhosts[0]);
    expect(vhostApi.getVhost).toHaveBeenCalledWith(apiClient, "vhost-1");
  });
});
