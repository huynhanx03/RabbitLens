import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useUsers, useUser } from "./user-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { userApi } from "./user-api";
import { ManagementApiClient } from "@/api/management-api-client";
import { mockUsers } from "@/test/fixtures/users";

vi.mock("./user-api", () => ({
  userApi: {
    getUsers: vi.fn(),
    getUser: vi.fn(),
  },
}));

describe("user queries", () => {
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

  it("useUsers fetches users", async () => {
    vi.mocked(userApi.getUsers).mockResolvedValueOnce(mockUsers);
    const { result } = renderHook(() => useUsers(apiClient), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUsers);
  });

  it("useUser fetches specific user", async () => {
    vi.mocked(userApi.getUser).mockResolvedValueOnce(mockUsers[0]);
    const { result } = renderHook(() => useUser(apiClient, "guest"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUsers[0]);
    expect(userApi.getUser).toHaveBeenCalledWith(apiClient, "guest");
  });
});
