import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { TracingPage } from "./tracing-page";

const client = { request: vi.fn(), requestVoid: vi.fn(), requestBlob: vi.fn() };

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual("@tanstack/react-router")),
  Link: ({ children }: { children: React.ReactNode }) => <a href="/test">{children}</a>,
  useRouteContext: () => ({ apiClient: client }),
}));

describe("TracingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.request.mockImplementation((path: string) => {
      if (path === "/nodes") return Promise.resolve([{ name: "rabbit@node" }]);
      if (path === "/vhosts") return Promise.resolve([{ name: "/" }]);
      if (path === "/traces/node/rabbit%40node") {
        return Promise.resolve([{ vhost: "/", name: "audit", format: "json", pattern: "#" }]);
      }
      if (path === "/trace-files/node/rabbit%40node") return Promise.resolve([]);
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
    client.requestVoid.mockResolvedValue(undefined);
  });

  it("confirms before stopping a node-scoped trace", async () => {
    renderWithProviders(<TracingPage />);
    await waitFor(() => expect(screen.getByText("audit")).toBeVisible());

    await userEvent.click(screen.getByRole("button", { name: "Stop trace audit" }));
    expect(client.requestVoid).not.toHaveBeenCalled();

    const dialog = screen.getByRole("alertdialog", { name: "Stop trace" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Stop trace" }));

    await waitFor(() =>
      expect(client.requestVoid).toHaveBeenCalledWith(
        "/traces/node/rabbit%40node/%2F/audit",
        { method: "DELETE" },
      ),
    );
  });
});
