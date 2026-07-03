import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { EtsTablesPage } from "./ets-tables-page";

const client = { request: vi.fn() };

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual("@tanstack/react-router")),
  Link: ({ children }: { children: React.ReactNode }) => <a href="/test">{children}</a>,
  useRouteContext: () => ({ apiClient: client }),
}));

describe("EtsTablesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.request.mockImplementation((path: string) => {
      if (path === "/nodes") return Promise.resolve([{ name: "rabbit@node" }]);
      if (path === "/top/ets/rabbit%40node?row_count=20") {
        return Promise.resolve({
          node: "rabbit@node",
          row_count: 20,
          ets_tables: [{ name: "rabbit_queue", owner: "<0.1.0>", memory: 1024, size: 2, type: "set" }],
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
  });

  it("loads ETS tables for the selected node", async () => {
    renderWithProviders(<EtsTablesPage />);
    await waitFor(() => expect(screen.getByText("rabbit_queue")).toBeVisible());
    expect(screen.getByRole("link", { name: "Processes" })).toBeVisible();
  });
});
