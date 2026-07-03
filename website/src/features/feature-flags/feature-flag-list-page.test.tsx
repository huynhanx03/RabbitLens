import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { FeatureFlagListPage } from "./feature-flag-list-page";

const client = {
  request: vi.fn(),
  requestVoid: vi.fn(),
};

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({ apiClient: client }),
  };
});

vi.mock("@/auth/permissions/permission-gate", () => ({
  usePermissionDecision: () => ({ kind: "allow" }),
}));

describe("FeatureFlagListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.request.mockResolvedValue([
      {
        name: "quorum_queue",
        desc: "Quorum queues",
        state: "disabled",
        provided_by: "rabbit",
      },
    ]);
    client.requestVoid.mockResolvedValue(undefined);
  });

  it("confirms before enabling an irreversible feature flag", async () => {
    renderWithProviders(<FeatureFlagListPage />);
    await waitFor(() =>
      expect(screen.getByText("quorum_queue")).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("button", { name: "Enable" }));
    expect(client.requestVoid).not.toHaveBeenCalled();

    const dialog = screen.getByRole("alertdialog", {
      name: "Enable feature flag",
    });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Enable" }),
    );
    await waitFor(() => expect(client.requestVoid).toHaveBeenCalledTimes(1));
  });
});
