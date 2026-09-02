import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import { DeleteVhostDialog } from "./delete-vhost-dialog";

const mutate = vi.fn();

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("./vhost-mutations", () => ({
  useDeleteVhostMutation: () => ({ mutate, error: null, isPending: false }),
}));

describe("DeleteVhostDialog", () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  it("requires exact virtual-host confirmation before deletion", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DeleteVhostDialog name="demo" open onOpenChange={vi.fn()} apiClient={{} as never} />,
    );

    const remove = screen.getByRole("button", { name: "Delete" });
    expect(remove).toBeDisabled();

    await user.type(screen.getByLabelText("Type the virtual host name to confirm"), "demo");
    await user.click(remove);

    expect(mutate).toHaveBeenCalledWith("demo", expect.any(Object));
  });

  it("clears a prior confirmation when its controlled dialog closes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const view = renderWithProviders(
      <DeleteVhostDialog name="demo" open onOpenChange={onOpenChange} apiClient={{} as never} />,
    );

    await user.type(screen.getByLabelText("Type the virtual host name to confirm"), "demo");
    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();

    view.rerender(
      <DeleteVhostDialog
        name="demo"
        open={false}
        onOpenChange={onOpenChange}
        apiClient={{} as never}
      />,
    );
    view.rerender(
      <DeleteVhostDialog name="demo" open onOpenChange={onOpenChange} apiClient={{} as never} />,
    );

    expect(screen.getByLabelText("Type the virtual host name to confirm")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });
});
