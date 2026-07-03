import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import { OverviewPage } from "./overview-page";
import { server } from "@/test/server";
import { http, HttpResponse } from "msw";
import { ManagementApiClient } from "@/api/management-api-client";
import { createRootRouteWithContext, createRouter, createMemoryHistory, RouterProvider } from "@tanstack/react-router";

describe("OverviewPage", () => {
  const setup = () => {
    const apiClient = new ManagementApiClient({
      baseUrl: "http://localhost/api",
      getSession: () => ({ type: "basic", authorization: "Basic XYZ" }),
      timeoutMs: 1000,
      fetcher: fetch,
      onUnauthorized: vi.fn(),
    });

    const rootRoute = createRootRouteWithContext<any>()({
      component: () => <OverviewPage />,
    });
    const router = createRouter({
      routeTree: rootRoute,
      history: createMemoryHistory({ initialEntries: ["/"] }),
      context: {
        apiClient,
        auth: { user: { name: "admin", tags: ["administrator"] } },
      },
    });

    renderWithProviders(<RouterProvider router={router} />);
  };

  it("renders overview totals and metrics", async () => {
    server.use(
      http.get("http://localhost/api/overview", () => {
        return HttpResponse.json({
          rabbitmq_version: "4.0.0",
          erlang_version: "27.0",
          management_version: "4.0.0",
          cluster_name: "test-cluster",
          disable_stats: false,
          object_totals: {
            connections: 10,
            channels: 25,
            exchanges: 8,
            queues: 15,
            consumers: 40,
          },
          queue_totals: {
            messages_ready: 12,
            messages_unacknowledged: 3,
            messages: 15,
          },
        });
      }),
      http.get("http://localhost/api/nodes", () => {
        return HttpResponse.json([
          { name: "rabbit@one", running: true },
          { name: "rabbit@two", running: false },
        ]);
      }),
    );

    setup();

    await screen.findByText("Connections", {}, { timeout: 3000 });
    expect(screen.queryByText("test-cluster")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1 }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Connections")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Ready messages")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Running nodes")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2);
  });

  it("handles missing stats gracefully", async () => {
    server.use(
      http.get("http://localhost/api/overview", () => {
        return HttpResponse.json({
          rabbitmq_version: "4.0.0",
          erlang_version: "27.0",
          management_version: "4.0.0",
          cluster_name: "test-cluster",
          disable_stats: true,
        });
      }),
      http.get("http://localhost/api/nodes", () => {
        return HttpResponse.json([{ name: "rabbit@one", running: true }]);
      }),
    );

    setup();

    await screen.findByText(
      /Statistics are globally disabled/,
      {},
      { timeout: 3000 },
    );
    expect(screen.queryByText("test-cluster")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Statistics are globally disabled/),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Unavailable").length).toBeGreaterThan(0);
  });
});
