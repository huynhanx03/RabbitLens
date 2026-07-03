import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ShovelStatusPage } from "./shovel-status-page";

const client = { request: vi.fn(), requestVoid: vi.fn() };

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual("@tanstack/react-router")),
  Link: ({ children }: { children: React.ReactNode }) => <a href="/test">{children}</a>,
  useRouteContext: () => ({
    apiClient: client,
    auth: { user: { tags: ["administrator"] } },
  }),
}));

describe("ShovelStatusPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.request.mockImplementation((path: string) => {
      if (path === "/vhosts") return Promise.resolve([{ name: "/" }]);
      if (path === "/shovels") return Promise.resolve([{
        vhost: "/", name: "orders", node: "rabbit@node", type: "dynamic",
        state: "running", src_uri: "amqp://user:secret@source", dest_uri: "amqp://target",
      }]);
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
    client.requestVoid.mockResolvedValue(undefined);
  });

  it("redacts credentials and confirms shovel restart", async () => {
    renderWithProviders(<ShovelStatusPage />);
    await waitFor(() => expect(screen.getByText("orders")).toBeVisible());
    expect(screen.queryByText(/secret/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Restart shovel orders" }));
    const dialog = screen.getByRole("alertdialog", { name: "Restart shovel" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Restart" }));
    await waitFor(() => expect(client.requestVoid).toHaveBeenCalledTimes(1));
  });
});
