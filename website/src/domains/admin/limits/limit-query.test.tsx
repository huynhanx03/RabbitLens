import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { deleteUserLimit, deleteVhostLimit, putUserLimit, putVhostLimit } from "./limit-api";
import { useClearLimitMutation, useSetLimitMutation } from "./limit-query";

vi.mock("./limit-api", () => ({
  getUserLimits: vi.fn(),
  getVhostLimits: vi.fn(),
  putUserLimit: vi.fn(),
  putVhostLimit: vi.fn(),
  deleteUserLimit: vi.fn(),
  deleteVhostLimit: vi.fn(),
}));

describe("limit mutations", () => {
  let queryClient: QueryClient;
  const client = {} as ManagementApiClient;

  beforeEach(() => {
    vi.resetAllMocks();
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  it("writes a limit through the matching vhost/user API and refreshes that scope", async () => {
    vi.mocked(putVhostLimit).mockResolvedValue(undefined);
    vi.mocked(putUserLimit).mockResolvedValue(undefined);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useSetLimitMutation(client), { wrapper });

    await result.current.mutateAsync({
      scope: "vhost",
      owner: "demo",
      name: "max-connections",
      value: 10,
    });
    await result.current.mutateAsync({
      scope: "user",
      owner: "operator",
      name: "max-channels",
      value: 5,
    });

    expect(putVhostLimit).toHaveBeenCalledWith(client, "demo", "max-connections", 10);
    expect(putUserLimit).toHaveBeenCalledWith(client, "operator", "max-channels", 5);
    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledTimes(2));
  });

  it("clears a limit through the matching vhost/user API", async () => {
    vi.mocked(deleteVhostLimit).mockResolvedValue(undefined);
    vi.mocked(deleteUserLimit).mockResolvedValue(undefined);
    const { result } = renderHook(() => useClearLimitMutation(client), { wrapper });

    await result.current.mutateAsync({ scope: "vhost", owner: "demo", name: "max-queues" });
    await result.current.mutateAsync({ scope: "user", owner: "operator", name: "max-connections" });

    expect(deleteVhostLimit).toHaveBeenCalledWith(client, "demo", "max-queues");
    expect(deleteUserLimit).toHaveBeenCalledWith(client, "operator", "max-connections");
  });
});
