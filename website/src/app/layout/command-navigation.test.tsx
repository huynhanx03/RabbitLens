import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { Cable } from "lucide-react";
import { describe, expect, it } from "vitest";
import type { NavigationGroup } from "@/app/navigation/navigation-types";
import { CommandNavigation } from "./command-navigation";

const groups: NavigationGroup[] = [
  {
    id: "topology",
    labelKey: "nav.groups.topology",
    items: [
      {
        id: "connections",
        labelKey: "nav.connections",
        to: "/connections",
        icon: Cable,
        keywords: ["network"],
        children: [
          {
            id: "stream-connections",
            labelKey: "streams.connections",
            to: "/connections/streams",
            keywords: ["stream"],
          },
        ],
      },
    ],
  },
];

function renderCommandNavigation(
  navigationGroups: NavigationGroup[] = groups,
) {
  const rootRoute = createRootRoute({
    component: () => (
      <CommandNavigation groups={navigationGroups} />
    ),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => null,
  });
  const connectionsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connections",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, connectionsRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  render(<RouterProvider router={router} />);
  return router;
}

describe("CommandNavigation", () => {
  it("opens with the platform shortcut", async () => {
    renderCommandNavigation();
    await screen.findByRole("button", { name: "Go to…" });

    fireEvent.keyDown(document, { key: "k", metaKey: true });

    expect(await screen.findByRole("dialog")).toBeVisible();
  });

  it("contains only the visible navigation groups", async () => {
    const user = userEvent.setup();
    renderCommandNavigation();

    await user.click(
      await screen.findByRole("button", { name: "Go to…" }),
    );

    expect(screen.getByText("Connections")).toBeVisible();
    expect(screen.getByText("Stream Connections")).toBeVisible();
    expect(screen.queryByText("Administration")).not.toBeInTheDocument();
  });

  it("navigates and closes after selection", async () => {
    const user = userEvent.setup();
    const router = renderCommandNavigation();

    await user.click(
      await screen.findByRole("button", { name: "Go to…" }),
    );
    await user.click(screen.getByText("Connections"));

    expect(router.state.location.pathname).toBe("/connections");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
