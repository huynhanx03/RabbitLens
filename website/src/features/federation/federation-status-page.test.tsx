import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { FederationStatusPage } from "./federation-status-page";

const client = { request: vi.fn(), requestVoid: vi.fn() };

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual("@tanstack/react-router")),
  Link: ({ children }: { children: React.ReactNode }) => <a href="/test">{children}</a>,
  useRouteContext: () => ({
    apiClient: client,
    auth: { user: { tags: ["administrator"] } },
  }),
}));

describe("FederationStatusPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.request.mockImplementation((path: string) => {
      if (path === "/vhosts") return Promise.resolve([{ name: "/" }]);
      if (path === "/federation-links") return Promise.resolve([{
        vhost: "/", id: "link-1", node: "rabbit@node", upstream: "remote",
        status: "running", uri: "amqp://user:secret@remote", timestamp: "now",
      }]);
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
    client.requestVoid.mockResolvedValue(undefined);
  });

  it("redacts credentials and confirms link restart", async () => {
    renderWithProviders(<FederationStatusPage />);
    await waitFor(() => expect(screen.getByText("remote")).toBeVisible());
    expect(screen.queryByText(/secret/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Restart link remote" }));
    expect(client.requestVoid).not.toHaveBeenCalled();
    const dialog = screen.getByRole("alertdialog", { name: "Restart link" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Restart" }));
    await waitFor(() => expect(client.requestVoid).toHaveBeenCalledTimes(1));
  });
});
