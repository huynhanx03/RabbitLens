import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { Cable } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import {
  ThemeContext,
  type ThemeContextValue,
} from "@/app/providers/theme-context";
import type { NavigationGroup } from "@/app/navigation/navigation-types";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppTopbar } from "./app-topbar";

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
      },
    ],
  },
];

function renderTopbar(onLogout = vi.fn()) {
  const theme: ThemeContextValue = {
    preference: "system",
    resolvedTheme: "light",
    setPreference: vi.fn(),
  };
  const rootRoute = createRootRoute({
    component: () => (
      <ThemeContext.Provider value={theme}>
        <SidebarProvider>
          <AppTopbar
            groups={groups}
            userName="guest"
            onLogout={onLogout}
          />
        </SidebarProvider>
      </ThemeContext.Provider>
    ),
  });
  const connectionsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/connections",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([connectionsRoute]),
    history: createMemoryHistory({
      initialEntries: ["/connections"],
    }),
  });

  render(<RouterProvider router={router} />);
  return onLogout;
}

describe("AppTopbar", () => {
  it("shows only the current route context", async () => {
    renderTopbar();

    expect(await screen.findByText("Connections")).toBeVisible();
    expect(screen.queryByText("rabbitlens-demo")).not.toBeInTheDocument();
    expect(screen.queryByText("RabbitMQ unreachable")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Density" }),
    ).not.toBeInTheDocument();
  });

  it("exposes user identity and sign out from the account menu", async () => {
    const user = userEvent.setup();
    const onLogout = renderTopbar();

    await user.click(
      await screen.findByRole("button", { name: "Account menu" }),
    );
    expect(screen.getByText("guest")).toBeVisible();
    await user.click(screen.getByRole("menuitem", { name: "Sign out" }));

    expect(onLogout).toHaveBeenCalledOnce();
  });
});
