import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import { NodeDetailPage } from "./node-detail-page";
import { server } from "@/test/server";
import { http, HttpResponse } from "msw";
import { ManagementApiClient } from "@/api/management-api-client";
import { createRootRouteWithContext, createRouter, createMemoryHistory, RouterProvider, Outlet, createRoute } from "@tanstack/react-router";

describe("NodeDetailPage", () => {
  const setup = () => {
    const apiClient = new ManagementApiClient({
      baseUrl: "http://localhost/api",
      getSession: () => ({ type: "basic", authorization: "Basic XYZ" }),
      timeoutMs: 1000,
      fetcher: fetch,
      onUnauthorized: vi.fn(),
    });

    const rootRoute = createRootRouteWithContext<any>()({
      component: () => <Outlet />,
    });
    
    // We need a route with a parameter
    const nodeRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/nodes/$name",
      component: NodeDetailPage,
    });

    const router = createRouter({
      routeTree: rootRoute.addChildren([nodeRoute]),
      history: createMemoryHistory({ initialEntries: ["/nodes/rabbit%40localhost"] }),
      context: { apiClient },
    });

    renderWithProviders(<RouterProvider router={router} />);
  };

  it("renders node detail metrics", async () => {
    server.use(
      http.get("http://localhost/api/nodes/rabbit%40localhost", ({ request }) => {
        const search = new URL(request.url).searchParams;
        if (search.get("binary") === "true") {
          return HttpResponse.json({
            name: "rabbit@localhost",
            running: true,
            binary: [{ pid: "<0.42.0>", bytes: 2048 }],
          });
        }

        return HttpResponse.json({
          name: "rabbit@localhost",
          type: "disc",
          running: true,
          uptime: 123456,
          fd_used: 25,
          fd_total: 1024,
          sockets_used: 10,
          sockets_total: 829,
          mem_used: 536870912,
          mem_limit: 1073741824,
          disk_free: 53687091200,
          disk_free_limit: 53687091,
          proc_used: 100,
          proc_total: 1048576,
          applications: [{ name: "rabbit", version: "4.4.0" }],
          enabled_plugins: ["rabbitmq_management"],
          config_files: ["/etc/rabbitmq/rabbitmq.conf"],
          log_files: ["/var/log/rabbitmq/rabbit.log"],
        });
      })
    );

    setup();

    expect(await screen.findByText("25", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText("Runtime")).toBeInTheDocument();
    expect(screen.getByText("Applications")).toBeInTheDocument();
    expect(screen.queryByText("<0.42.0>")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Load binary memory details" }),
    );
    expect(
      screen.getByText(
        "This request can be expensive on nodes with many small binaries.",
      ),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Load details" }));
    expect(await screen.findByText(/<0.42.0>/)).toBeInTheDocument();
  });
});
