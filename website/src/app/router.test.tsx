import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { RouterProvider, createRouter, createMemoryHistory } from "@tanstack/react-router";
import { routeTree } from "./route-tree.gen";
import { QueryClient } from "@tanstack/react-query";
import { ManagementApiClient } from "@/api/management-api-client";
import { PRODUCT_DEFAULTS } from "@/config/defaults";

describe("Router Guards", () => {
  const queryClient = new QueryClient();
  const apiClient = new ManagementApiClient({ baseUrl: "", getSession: () => ({ type: "anonymous" }), timeoutMs: 100, fetcher: vi.fn(), onUnauthorized: vi.fn() });
  const runtimeConfig = {
    apiBaseUrl: "",
    auth: { basic: true, oauth: null },
    defaultLocale: PRODUCT_DEFAULTS.locale,
    defaultTheme: PRODUCT_DEFAULTS.theme,
  };

  it("redirects anonymous users from authenticated routes to /login", async () => {
    const history = createMemoryHistory({ initialEntries: ["/nodes"] });
    const router = createRouter({
      routeTree,
      history,
      context: {
        auth: {
          session: { type: "anonymous" },
          user: null,
          loginBasic: vi.fn(),
          setBearer: vi.fn(),
          setRestoringOAuth: vi.fn(),
          setExpiring: vi.fn(),
          setExpired: vi.fn(),
          setUser: vi.fn(),
          logout: vi.fn(),
        },
        queryClient,
        apiClient,
        runtimeConfig,
      },
    });

    renderWithProviders(<RouterProvider router={router} />);
    
    // We wait for the router to finish resolving and redirecting
    // @ts-expect-error isReady is not in the type definition but works at runtime for test resolution
    await router.isReady;
    expect(router.state.location.pathname).toBe("/login");
    // @ts-expect-error The search object is typed generically here
    expect(router.state.location.search.redirect).toBe("/nodes");
  });

  it("redirects authenticated users away from /login", async () => {
    const history = createMemoryHistory({ initialEntries: ["/login"] });
    const router = createRouter({
      routeTree,
      history,
      context: {
        auth: {
          session: { type: "basic", authorization: "Basic XYZ" },
          user: { name: "guest", tags: [] },
          loginBasic: vi.fn(),
          setBearer: vi.fn(),
          setRestoringOAuth: vi.fn(),
          setExpiring: vi.fn(),
          setExpired: vi.fn(),
          setUser: vi.fn(),
          logout: vi.fn(),
        },
        queryClient,
        apiClient,
        runtimeConfig,
      },
    });

    renderWithProviders(<RouterProvider router={router} />);
    
    // @ts-expect-error isReady is not in the type definition but works at runtime
    await router.isReady;
    expect(router.state.location.pathname).toBe("/");
  });
});
