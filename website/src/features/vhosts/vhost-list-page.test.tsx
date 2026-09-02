import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { VhostListPage } from "./vhost-list-page";

const client = { request: vi.fn(), requestVoid: vi.fn() };

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({ apiClient: client }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock("@/auth/permissions/permission-gate", () => ({
  usePermissionDecision: () => ({ kind: "allow" }),
}));

describe("VhostListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.request.mockResolvedValue([
      { name: "/", description: "Default", tags: ["production"], default_queue_type: "classic" },
      { name: "staging", description: "Pre-release", tags: [], default_queue_type: "quorum" },
    ]);
  });

  it("lists vhosts with queue types and filters by name", async () => {
    renderWithProviders(<VhostListPage />);

    await waitFor(() => expect(screen.getByText("staging")).toBeVisible());
    expect(screen.getByText("production")).toBeVisible();
    expect(screen.getByText("quorum")).toBeVisible();

    await userEvent.type(screen.getByRole("textbox", { name: "Filter by name" }), "stag");
    await userEvent.click(screen.getByRole("button", { name: "Filter" }));

    expect(screen.getByText("staging")).toBeVisible();
    expect(screen.queryByText("Default")).not.toBeInTheDocument();
  });
});
