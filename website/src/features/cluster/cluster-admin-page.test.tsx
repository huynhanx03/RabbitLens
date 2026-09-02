import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ClusterAdminPage } from "./cluster-admin-page";

const client = { request: vi.fn(), requestVoid: vi.fn() };

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return { ...actual, useRouteContext: () => ({ apiClient: client }) };
});

vi.mock("@/domains/admin/definitions/definition-admin-page", () => ({
  DefinitionAdminPage: () => <div data-testid="definitions-admin" />,
}));

describe("ClusterAdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.request.mockResolvedValue({ name: "rabbit-a" });
    client.requestVoid.mockResolvedValue(undefined);
  });

  it("updates the cluster name only after a meaningful change", async () => {
    renderWithProviders(<ClusterAdminPage />);

    const input = await screen.findByLabelText("Cluster Name");
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();

    await userEvent.clear(input);
    await userEvent.type(input, "rabbit-production");
    await userEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() =>
      expect(client.requestVoid).toHaveBeenCalledWith("/cluster-name", {
        method: "PUT",
        body: JSON.stringify({ name: "rabbit-production" }),
      }),
    );
  });

  it("requires confirmation before resetting cluster statistics", async () => {
    renderWithProviders(<ClusterAdminPage />);
    await screen.findByLabelText("Cluster Name");

    await userEvent.click(screen.getByRole("button", { name: "Reset all statistics" }));
    expect(client.requestVoid).not.toHaveBeenCalled();

    const dialog = screen.getByRole("alertdialog", { name: "Reset all statistics" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Reset all statistics" }));

    await waitFor(() =>
      expect(client.requestVoid).toHaveBeenCalledWith("/reset", { method: "DELETE" }),
    );
  });
});
