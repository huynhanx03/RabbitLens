import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import { NodesPage } from "./nodes-page";
import { server } from "@/test/server";
import { http, HttpResponse } from "msw";
import { ManagementApiClient } from "@/api/management-api-client";
import { createRootRouteWithContext, createRouter, createMemoryHistory, RouterProvider } from "@tanstack/react-router";

describe("NodesPage", () => {
  const setup = () => {
    const apiClient = new ManagementApiClient({
      baseUrl: "http://localhost/api",
      getSession: () => ({ type: "basic", authorization: "Basic XYZ" }),
      timeoutMs: 1000,
      fetcher: fetch,
      onUnauthorized: vi.fn(),
    });

    const rootRoute = createRootRouteWithContext<any>()({
      component: () => <NodesPage />,
    });
    const router = createRouter({
      routeTree: rootRoute,
      history: createMemoryHistory({ initialEntries: ["/nodes"] }),
      context: { apiClient },
    });

    renderWithProviders(<RouterProvider router={router} />);
  };

  it("renders a list of nodes", async () => {
    server.use(
      http.get("http://localhost/api/nodes", () => {
        return HttpResponse.json([
          {
            name: "rabbit@node1",
            type: "disc",
            running: true,
            uptime: 123456,
          },
          {
            name: "rabbit@node2",
            type: "ram",
            running: false,
            uptime: 0,
          },
        ]);
      })
    );

    setup();

    // Wait for the table to load
    expect(await screen.findByText("rabbit@node1", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText("rabbit@node2")).toBeInTheDocument();
    
    // Verify types
    expect(screen.getByText("disc")).toBeInTheDocument();
    expect(screen.getByText("ram")).toBeInTheDocument();
  });
});
