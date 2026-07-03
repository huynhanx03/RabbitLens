import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { PolicyListPage } from "./policy-list-page";

const client = { request: vi.fn(), requestVoid: vi.fn() };

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return { ...actual, useRouteContext: () => ({ apiClient: client }) };
});

vi.mock("@/auth/permissions/permission-gate", () => ({
  usePermissionDecision: () => ({ kind: "allow" }),
}));

describe("PolicyListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.request.mockImplementation((path: string) => {
      if (path === "/policies") {
        return Promise.resolve([
          {
            vhost: "/",
            name: "ha-all",
            pattern: ".*",
            "apply-to": "queues",
            definition: { "ha-mode": "all" },
            priority: 0,
          },
        ]);
      }
      return Promise.resolve([]);
    });
    client.requestVoid.mockResolvedValue(undefined);
  });

  it("confirms before deleting a policy", async () => {
    renderWithProviders(<PolicyListPage />);
    await waitFor(() => expect(screen.getByText("ha-all")).toBeInTheDocument());

    await userEvent.click(
      screen.getByRole("button", { name: "Delete policy ha-all" }),
    );
    expect(client.requestVoid).not.toHaveBeenCalled();

    const dialog = screen.getByRole("alertdialog", { name: "Delete policy" });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Delete" }),
    );
    await waitFor(() => expect(client.requestVoid).toHaveBeenCalledTimes(1));
  });
});
