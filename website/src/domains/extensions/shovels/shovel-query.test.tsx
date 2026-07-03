import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useShovels } from "./shovel-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { shovelApi } from "./shovel-api";
import { ManagementApiClient } from "@/api/management-api-client";
import { mockShovels } from "@/test/fixtures/extensions/shovels";

vi.mock("./shovel-api", () => ({
  shovelApi: {
    getShovels: vi.fn(),
  },
}));

describe("shovel queries", () => {
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

  it("useShovels fetches shovels", async () => {
    vi.mocked(shovelApi.getShovels).mockResolvedValueOnce(mockShovels);
    const { result } = renderHook(() => useShovels(apiClient), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockShovels);
  });
});
