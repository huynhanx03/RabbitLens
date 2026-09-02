import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { UserListPage } from "./user-list-page";

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

describe("UserListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.request.mockResolvedValue([
      { name: "admin", tags: ["administrator"] },
      { name: "readonly", tags: ["monitoring"] },
    ]);
  });

  it("lists tags and filters users by name", async () => {
    renderWithProviders(<UserListPage />);

    await waitFor(() => expect(screen.getByText("readonly")).toBeVisible());
    expect(screen.getByText("administrator")).toBeVisible();

    await userEvent.type(screen.getByRole("textbox", { name: "Filter by name" }), "read");
    await userEvent.click(screen.getByRole("button", { name: "Filter" }));

    expect(screen.getByText("readonly")).toBeVisible();
    expect(screen.queryByText("admin")).not.toBeInTheDocument();
  });
});
