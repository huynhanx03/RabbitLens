import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { UserDetailPage } from "./user-detail-page";

const client = { request: vi.fn(), requestVoid: vi.fn() };

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({ apiClient: client }),
    useParams: () => ({ name: "ops" }),
    useNavigate: () => vi.fn(),
    Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
  };
});

vi.mock("@/auth/permissions/permission-gate", () => ({
  usePermissionDecision: () => ({ kind: "allow" }),
}));

vi.mock("@/domains/admin/users/user-query", () => ({
  useUser: () => ({
    data: { name: "ops", tags: ["administrator"], limits: { "max-connections": 10 } },
    isPending: false,
    isError: false,
  }),
  useUserPermissions: () => ({
    data: [{ user: "ops", vhost: "/", configure: ".*", write: "^orders", read: ".*" }],
    isPending: false,
  }),
  useUserTopicPermissions: () => ({
    data: [{ user: "ops", vhost: "/", exchange: "amq.topic", write: "^orders", read: ".*" }],
    isPending: false,
  }),
}));

describe("UserDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.requestVoid.mockResolvedValue(undefined);
  });

  it("renders limits and both RabbitMQ permission scopes", () => {
    renderWithProviders(<UserDetailPage />);

    expect(screen.getByRole("heading", { name: "ops" })).toBeVisible();
    expect(screen.getByText("administrator")).toBeVisible();
    expect(screen.getByText("1")).toBeVisible();
    expect(screen.getAllByText("^orders")).toHaveLength(2);
    expect(screen.getByText("amq.topic")).toBeVisible();
  });

  it("requires confirmation before clearing a vhost permission", async () => {
    renderWithProviders(<UserDetailPage />);

    await userEvent.click(screen.getByRole("button", { name: "Clear permission /" }));
    expect(client.requestVoid).not.toHaveBeenCalled();

    const dialog = screen.getByRole("alertdialog", { name: "Clear permission" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Clear" }));

    await waitFor(() =>
      expect(client.requestVoid).toHaveBeenCalledWith("/permissions/%2F/ops", { method: "DELETE" }),
    );
  });

  it("clears topic permissions with the exchange in the destructive target", async () => {
    renderWithProviders(<UserDetailPage />);

    await userEvent.click(screen.getByRole("button", { name: "Clear topic permission amq.topic" }));
    const dialog = screen.getByRole("alertdialog", { name: "Clear topic permission" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Clear" }));

    await waitFor(() =>
      expect(client.requestVoid).toHaveBeenCalledWith("/topic-permissions/%2F/ops/amq.topic", {
        method: "DELETE",
      }),
    );
  });

  it("closes the set-permission dialog without issuing a mutation", async () => {
    renderWithProviders(<UserDetailPage />);

    await userEvent.click(screen.getByRole("button", { name: "Set permission" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("dialog", { name: "Set permission for ops" }),
    ).not.toBeInTheDocument();
    expect(client.requestVoid).not.toHaveBeenCalled();
  });

  it("requires typing the exact user name before deleting the account", async () => {
    renderWithProviders(<UserDetailPage />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("dialog", { name: "Delete user" });
    const deleteButton = within(dialog).getByRole("button", { name: "Delete" });
    expect(deleteButton).toBeDisabled();

    await userEvent.type(within(dialog).getByLabelText("Type the user name to confirm"), "ops");
    await userEvent.click(deleteButton);

    await waitFor(() =>
      expect(client.requestVoid).toHaveBeenCalledWith("/users/ops", { method: "DELETE" }),
    );
  });

  it("updates user tags and password while keeping the account name immutable", async () => {
    renderWithProviders(<UserDetailPage />);

    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const dialog = screen.getByRole("dialog", { name: "Update user" });
    expect(within(dialog).getByLabelText("Name")).toBeDisabled();
    await userEvent.clear(within(dialog).getByLabelText("Tags"));
    await userEvent.type(within(dialog).getByLabelText("Tags"), "monitoring");
    await userEvent.type(
      within(dialog).getByLabelText("Password (leave blank to keep unchanged)"),
      "new-secret",
    );
    await userEvent.click(within(dialog).getByRole("button", { name: "Update user" }));

    await waitFor(() =>
      expect(client.requestVoid).toHaveBeenCalledWith("/users/ops", {
        method: "PUT",
        body: JSON.stringify({ tags: "monitoring", password: "new-secret" }),
      }),
    );
  });
});
