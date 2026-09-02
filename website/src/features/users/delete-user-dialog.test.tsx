import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { DeleteUserDialog } from "./delete-user-dialog";

const navigate = vi.fn();
const apiClient = { requestVoid: vi.fn() };

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual("@tanstack/react-router")),
  useNavigate: () => navigate,
}));

function renderDialog(open: boolean, onOpenChange = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return {
    onOpenChange,
    ...render(
      <QueryClientProvider client={queryClient}>
        <DeleteUserDialog
          name="ops"
          open={open}
          onOpenChange={onOpenChange}
          apiClient={apiClient as never}
        />
      </QueryClientProvider>,
    ),
  };
}

describe("DeleteUserDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.requestVoid.mockResolvedValue(undefined);
  });

  it("requires the exact user name and navigates after a successful deletion", async () => {
    renderDialog(true);

    const deleteButton = screen.getByRole("button", { name: "Delete" });
    expect(deleteButton).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Type the user name to confirm"), "ops");
    await userEvent.click(deleteButton);

    expect(apiClient.requestVoid).toHaveBeenCalledWith("/users/ops", { method: "DELETE" });
    expect(navigate).toHaveBeenCalledWith({ to: "/admin/users" });
  });

  it("clears the typed confirmation whenever the dialog closes", async () => {
    const { rerender, onOpenChange } = renderDialog(true);
    const input = screen.getByLabelText("Type the user name to confirm");
    await userEvent.type(input, "ops");
    expect(input).toHaveValue("ops");

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <DeleteUserDialog
          name="ops"
          open={false}
          onOpenChange={onOpenChange}
          apiClient={apiClient as never}
        />
      </QueryClientProvider>,
    );
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <DeleteUserDialog
          name="ops"
          open
          onOpenChange={onOpenChange}
          apiClient={apiClient as never}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText("Type the user name to confirm")).toHaveValue("");
  });
});
