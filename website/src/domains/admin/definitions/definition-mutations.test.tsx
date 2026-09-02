import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { definitionApi } from "./definition-api";
import { useImportDefinitionsMutation } from "./definition-mutations";

vi.mock("./definition-api", () => ({ definitionApi: { importDefinitions: vi.fn() } }));

describe("definition import mutation", () => {
  let queryClient: QueryClient;
  const client = {} as ManagementApiClient;

  beforeEach(() => {
    vi.resetAllMocks();
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  it("imports a scoped definition and refreshes every affected resource family", async () => {
    vi.mocked(definitionApi.importDefinitions).mockResolvedValue(undefined);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useImportDefinitionsMutation(client), { wrapper });
    const body = { users: [], vhosts: [], queues: [], exchanges: [], bindings: [] };

    await result.current.mutateAsync({ body, vhost: "demo" });

    expect(definitionApi.importDefinitions).toHaveBeenCalledWith(client, body, "demo");
    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledTimes(5));
  });
});
