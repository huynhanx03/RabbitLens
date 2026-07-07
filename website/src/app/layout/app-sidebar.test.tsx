import { render, screen } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { Gauge, Network } from "lucide-react";
import { describe, expect, it } from "vitest";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { NavigationGroup } from "@/app/navigation/navigation-types";
import { AppSidebar } from "./app-sidebar";

const groups: NavigationGroup[] = [
  {
    id: "monitor",
    labelKey: "nav.groups.monitor",
    items: [
      {
        id: "overview",
        labelKey: "nav.overview",
        to: "/",
        icon: Gauge,
        keywords: [],
      },
    ],
  },
  {
    id: "topology",
    labelKey: "nav.groups.topology",
    items: [
      {
        id: "connections",
        labelKey: "nav.connections",
        to: "/connections",
        icon: Network,
        keywords: [],
        children: [
          {
            id: "stream-connections",
            labelKey: "streams.connections",
            to: "/connections/streams",
            keywords: [],
          },
        ],
      },
    ],
  },
];

function renderSidebar(currentPath: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar currentPath={currentPath} groups={groups} />
        </SidebarProvider>
      </TooltipProvider>
    ),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  render(<RouterProvider router={router} />);
}

describe("AppSidebar", () => {
  it("renders grouped navigation without selecting a parent that has children", async () => {
    renderSidebar("/connections");

    expect(await screen.findByText("Monitor")).toBeVisible();
    expect(screen.getByText("Topology")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Connections" }),
    ).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Connections" })).toHaveClass(
      "rl-sidebar-item",
    );
  });

  it("keeps desktop navigation expanded without a collapse control", async () => {
    renderSidebar("/");

    expect(
      await screen.findByRole("link", { name: "Overview" }),
    ).toBeVisible();
    expect(screen.getByText("Monitor")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Collapse sidebar" }),
    ).not.toBeInTheDocument();
  });

  it("selects only the active child destination", async () => {
    renderSidebar("/connections/streams");
    expect(
      await screen.findByRole("link", { name: "Connections" }),
    ).not.toHaveAttribute("aria-current");
    expect(
      screen.getByRole("link", { name: "Stream Connections" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("does not preselect the first child at the parent destination", async () => {
    renderSidebar("/connections");

    expect(
      await screen.findByRole("link", { name: "Stream Connections" }),
    ).not.toHaveAttribute("aria-current");
  });

});
