import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import { AppShell } from "./app-shell";
import {
  createRouter,
  createMemoryHistory,
  createRootRouteWithContext,
  createFileRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { ManagementApiClient } from "@/api/management-api-client";
import { server } from "@/test/server";
import { http, HttpResponse } from "msw";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { type RouterContext } from "./routes/__root";

describe("AppShell", () => {
  const setup = (roles: string[] = ["administrator"]) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const apiClient = new ManagementApiClient({
      baseUrl: "http://localhost/api",
      getSession: () => ({ type: "basic", authorization: "Basic XYZ" }),
      timeoutMs: 1000,
      fetcher: fetch,
      onUnauthorized: vi.fn(),
    });

    const rootRoute = createRootRouteWithContext<RouterContext>()({
      component: AppShell,
    });

    // add dummy child routes
    const overviewRoute = (createFileRoute as any)("/")({
      component: () => <div>OverviewPage</div>,
    });
    overviewRoute.update({ getParentRoute: () => rootRoute, path: "/" });

    const router = createRouter({
      routeTree: rootRoute.addChildren([overviewRoute]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
      context: {
        auth: {
          session: { type: "basic", authorization: "Basic XYZ" },
          user: { name: "guest", tags: roles },
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
        runtimeConfig: {
          apiBaseUrl: "http://localhost/api",
          auth: { basic: true, oauth: null },
          defaultLocale: PRODUCT_DEFAULTS.locale,
          defaultTheme: PRODUCT_DEFAULTS.theme,
        },
      },
    });

    renderWithProviders(<RouterProvider router={router} />);
    return { router, queryClient };
  };

  it("renders the sidebar, top bar, and routed content", async () => {
    setup(["administrator"]);

    expect(
      await screen.findByRole(
        "navigation",
        { name: "Primary navigation" },
        { timeout: 3000 },
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Go to…" })).toBeVisible();
    expect(screen.getByText("OverviewPage")).toBeVisible();
    expect(screen.getByRole("link", { name: "Virtual Hosts" })).toBeVisible();
    expect(screen.getByRole("banner")).toHaveClass("rl-topbar");
    expect(
      screen
        .getByRole("navigation", { name: "Primary navigation" })
        .closest("[data-slot='sidebar']"),
    ).toHaveClass("rl-sidebar");
  });

  it("hides admin navigation for monitoring role", async () => {
    setup(["monitoring"]);

    expect(
      await screen.findByRole(
        "navigation",
        { name: "Primary navigation" },
        { timeout: 3000 },
      ),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Overview" })).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Virtual Hosts" }),
    ).not.toBeInTheDocument();
  });

  it("does not duplicate primary links in the top bar", async () => {
    setup(["administrator"]);

    await screen.findByRole("navigation", {
      name: "Primary navigation",
    });
    expect(screen.getAllByRole("link", { name: "Overview" })).toHaveLength(1);
  });

  it("does not block routed content when overview is unavailable", async () => {
    server.use(
      http.get("http://localhost/api/overview", () =>
        HttpResponse.json({ error: "unavailable" }, { status: 503 }),
      ),
    );
    setup(["administrator"]);

    expect(await screen.findByText("OverviewPage")).toBeVisible();
    expect(
      screen.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeVisible();
  });

  it("shows Federation if the extension is loaded", async () => {
    server.use(
      http.get("http://localhost/api/extensions", () => {
        return HttpResponse.json([{ javascript_src: "federation.js" }]);
      }),
    );
    setup(["administrator"]);

    expect(
      await screen.findByRole(
        "navigation",
        { name: "Primary navigation" },
        { timeout: 3000 },
      ),
    ).toBeVisible();

    // Wait for Federation link to appear
    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /^Federation$/ }),
      ).toBeInTheDocument();
    });
  });
});
