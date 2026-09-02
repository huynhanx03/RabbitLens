import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { vhostApi } from "@/domains/admin/vhosts/vhost-api";
import {
  useCreateVhostMutation,
  useDeleteVhostMutation,
  useRestartVhostMutation,
  useToggleVhostProtectionMutation,
} from "./vhost-mutations";

vi.mock("@/domains/admin/vhosts/vhost-api", () => ({
  vhostApi: {
    putVhost: vi.fn(),
    deleteVhost: vi.fn(),
    putVhostDeletionProtection: vi.fn(),
    deleteVhostDeletionProtection: vi.fn(),
    postVhostStart: vi.fn(),
  },
}));

describe("vhost mutations", () => {
  let queryClient: QueryClient;
  const client = {} as ManagementApiClient;

  beforeEach(() => {
    vi.resetAllMocks();
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  it("creates a vhost and invalidates its list and detail", async () => {
    vi.mocked(vhostApi.putVhost).mockResolvedValue(undefined);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateVhostMutation(client), { wrapper });

    await result.current.mutateAsync({ name: "demo", body: { tracing: false } });

    expect(vhostApi.putVhost).toHaveBeenCalledWith(client, "demo", { tracing: false });
    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledTimes(2));
  });

  it("invalidates broadly after delete and toggles deletion protection with the selected API", async () => {
    vi.mocked(vhostApi.deleteVhost).mockResolvedValue(undefined);
    vi.mocked(vhostApi.putVhostDeletionProtection).mockResolvedValue(undefined);
    vi.mocked(vhostApi.deleteVhostDeletionProtection).mockResolvedValue(undefined);
    const { result } = renderHook(
      () => ({
        remove: useDeleteVhostMutation(client),
        toggle: useToggleVhostProtectionMutation(client),
      }),
      { wrapper },
    );

    await result.current.remove.mutateAsync("demo");
    await result.current.toggle.mutateAsync({ name: "demo", enable: true });
    await result.current.toggle.mutateAsync({ name: "demo", enable: false });

    expect(vhostApi.deleteVhost).toHaveBeenCalledWith(client, "demo");
    expect(vhostApi.putVhostDeletionProtection).toHaveBeenCalledWith(client, "demo");
    expect(vhostApi.deleteVhostDeletionProtection).toHaveBeenCalledWith(client, "demo");
  });

  it("restarts on the selected node and refreshes vhost plus overview", async () => {
    vi.mocked(vhostApi.postVhostStart).mockResolvedValue(undefined);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useRestartVhostMutation(client), { wrapper });

    await result.current.mutateAsync({ vhost: "demo", node: "rabbit@one" });

    expect(vhostApi.postVhostStart).toHaveBeenCalledWith(client, "demo", "rabbit@one");
    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledTimes(2));
  });
});
