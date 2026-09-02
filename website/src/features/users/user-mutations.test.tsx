import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { userApi } from "@/domains/admin/users/user-api";
import {
  useClearPermissionMutation,
  useClearTopicPermissionMutation,
  useCreateUserMutation,
  useDeleteUserMutation,
  useSetPermissionMutation,
  useSetTopicPermissionMutation,
} from "./user-mutations";

vi.mock("@/domains/admin/users/user-api", () => ({
  userApi: {
    putUser: vi.fn(),
    deleteUser: vi.fn(),
    putUserPermission: vi.fn(),
    deleteUserPermission: vi.fn(),
    putUserTopicPermission: vi.fn(),
    deleteUserTopicPermission: vi.fn(),
  },
}));

describe("user mutations", () => {
  let queryClient: QueryClient;
  const client = {} as ManagementApiClient;

  beforeEach(() => {
    vi.resetAllMocks();
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  it("creates and deletes users while invalidating the affected list/detail", async () => {
    vi.mocked(userApi.putUser).mockResolvedValue(undefined);
    vi.mocked(userApi.deleteUser).mockResolvedValue(undefined);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => ({ create: useCreateUserMutation(client), remove: useDeleteUserMutation(client) }),
      { wrapper },
    );

    await result.current.create.mutateAsync({
      name: "operator",
      body: { password: "secret", tags: "" },
    });
    await result.current.remove.mutateAsync("operator");

    expect(userApi.putUser).toHaveBeenCalledWith(client, "operator", {
      password: "secret",
      tags: "",
    });
    expect(userApi.deleteUser).toHaveBeenCalledWith(client, "operator");
    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledTimes(3));
  });

  it("updates and clears regular permissions without invalidating unrelated data", async () => {
    vi.mocked(userApi.putUserPermission).mockResolvedValue(undefined);
    vi.mocked(userApi.deleteUserPermission).mockResolvedValue(undefined);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => ({ set: useSetPermissionMutation(client), clear: useClearPermissionMutation(client) }),
      { wrapper },
    );

    await result.current.set.mutateAsync({
      user: "operator",
      vhost: "demo",
      body: { configure: ".*", write: ".*", read: ".*" },
    });
    await result.current.clear.mutateAsync({ user: "operator", vhost: "demo" });

    expect(userApi.putUserPermission).toHaveBeenCalledOnce();
    expect(userApi.deleteUserPermission).toHaveBeenCalledWith(client, "operator", "demo");
    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledTimes(2));
  });

  it("updates and clears topic permissions for the same user scope", async () => {
    vi.mocked(userApi.putUserTopicPermission).mockResolvedValue(undefined);
    vi.mocked(userApi.deleteUserTopicPermission).mockResolvedValue(undefined);
    const { result } = renderHook(
      () => ({
        set: useSetTopicPermissionMutation(client),
        clear: useClearTopicPermissionMutation(client),
      }),
      { wrapper },
    );

    await result.current.set.mutateAsync({
      user: "operator",
      vhost: "demo",
      body: { exchange: "amq.topic", write: "#", read: "#" },
    });
    await result.current.clear.mutateAsync({
      user: "operator",
      vhost: "demo",
      exchange: "amq.topic",
    });

    expect(userApi.putUserTopicPermission).toHaveBeenCalledOnce();
    expect(userApi.deleteUserTopicPermission).toHaveBeenCalledWith(
      client,
      "operator",
      "demo",
      "amq.topic",
    );
  });
});
