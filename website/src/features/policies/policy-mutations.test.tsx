import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import { policyApi } from "@/domains/admin/policies/policy-api";
import { policyKeys } from "@/domains/admin/policies/policy-query";
import { useCreatePolicyMutation, useDeletePolicyMutation } from "./policy-mutations";

vi.mock("@/domains/admin/policies/policy-api", () => ({
  policyApi: {
    putPolicy: vi.fn(),
    putOperatorPolicy: vi.fn(),
    deletePolicy: vi.fn(),
    deleteOperatorPolicy: vi.fn(),
  },
}));

describe("policy mutations", () => {
  const client = {} as ManagementApiClient;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  it("saves a regular policy and invalidates its list and detail scopes", async () => {
    vi.mocked(policyApi.putPolicy).mockResolvedValue(undefined);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreatePolicyMutation(client), { wrapper });
    const variables = {
      vhost: "/",
      name: "orders",
      body: { pattern: "^orders", "apply-to": "queues" as const, priority: 1, definition: {} },
    };

    await result.current.mutateAsync(variables);

    expect(policyApi.putPolicy).toHaveBeenCalledWith(client, "/", "orders", variables.body);
    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: policyKeys.detail("/", "orders"),
      }),
    );
  });

  it("uses operator endpoints and invalidates only operator scopes", async () => {
    vi.mocked(policyApi.putOperatorPolicy).mockResolvedValue(undefined);
    vi.mocked(policyApi.deleteOperatorPolicy).mockResolvedValue(undefined);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => ({
        create: useCreatePolicyMutation(client, true),
        remove: useDeletePolicyMutation(client, true),
      }),
      { wrapper },
    );
    const body = { pattern: ".*", "apply-to": "all" as const, priority: 0, definition: {} };

    await result.current.create.mutateAsync({ vhost: "/", name: "guard", body });
    await result.current.remove.mutateAsync({ vhost: "/", name: "guard" });

    expect(policyApi.putOperatorPolicy).toHaveBeenCalledWith(client, "/", "guard", body);
    expect(policyApi.deleteOperatorPolicy).toHaveBeenCalledWith(client, "/", "guard");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: policyKeys.operatorLists() });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: policyKeys.operatorDetail("/", "guard"),
    });
    expect(invalidateQueries).not.toHaveBeenCalledWith({ queryKey: policyKeys.lists() });
  });
});
