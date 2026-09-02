import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { LimitListPage } from "./limit-list-page";

const client = { request: vi.fn(), requestVoid: vi.fn() };
let userTags = ["administrator"];

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({ apiClient: client, auth: { user: { tags: userTags } } }),
  };
});

describe("LimitListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userTags = ["administrator"];
    client.request.mockImplementation((path: string) => {
      if (path === "/vhost-limits") {
        return Promise.resolve([{ vhost: "/", value: { "max-connections": 20 } }]);
      }
      if (path === "/user-limits") return Promise.resolve([]);
      if (path === "/vhosts") return Promise.resolve([{ name: "/" }]);
      if (path === "/users") return Promise.resolve([{ name: "admin" }]);
      return Promise.resolve([]);
    });
    client.requestVoid.mockResolvedValue(undefined);
  });

  it("shows vhost limits and requires confirmation before clearing one", async () => {
    renderWithProviders(<LimitListPage />);

    await waitFor(() => expect(screen.getByText("max-connections")).toBeVisible());
    expect(screen.getByText("20")).toBeVisible();
    expect(screen.getByRole("tab", { name: "User limits" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Clear max-connections" }));
    expect(client.requestVoid).not.toHaveBeenCalled();

    const dialog = screen.getByRole("alertdialog", { name: "Clear limit" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Clear" }));

    await waitFor(() =>
      expect(client.requestVoid).toHaveBeenCalledWith("/vhost-limits/%2F/max-connections", {
        method: "DELETE",
      }),
    );
  });

  it("does not load or expose user limits to a non-administrator", async () => {
    userTags = ["monitoring"];
    renderWithProviders(<LimitListPage />);

    await waitFor(() => expect(screen.getByText("max-connections")).toBeVisible());
    expect(screen.queryByRole("tab", { name: "User limits" })).not.toBeInTheDocument();
    expect(client.request).not.toHaveBeenCalledWith("/user-limits", expect.anything());
  });

  it("lets an administrator set a user limit through the scoped form", async () => {
    renderWithProviders(<LimitListPage />);

    await screen.findByText("max-connections");
    await userEvent.click(screen.getByRole("tab", { name: "User limits" }));
    await userEvent.click(screen.getByRole("button", { name: "Set a limit" }));

    const dialog = screen.getByRole("dialog", { name: "Set a limit" });
    await userEvent.click(within(dialog).getByLabelText("Limit"));
    await userEvent.click(screen.getByRole("option", { name: "Max queues" }));
    await userEvent.clear(within(dialog).getByLabelText("Value"));
    await userEvent.type(within(dialog).getByLabelText("Value"), "40");
    await userEvent.click(within(dialog).getByRole("button", { name: "Set a limit" }));

    await waitFor(() =>
      expect(client.requestVoid).toHaveBeenCalledWith("/user-limits/admin/max-queues", {
        method: "PUT",
        body: JSON.stringify({ value: 40 }),
      }),
    );
  });
});
