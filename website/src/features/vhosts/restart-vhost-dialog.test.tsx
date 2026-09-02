import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import { RestartVhostDialog } from "./restart-vhost-dialog";

const mutate = vi.fn();

vi.mock("./vhost-mutations", () => ({
  useRestartVhostMutation: () => ({ mutate, error: null, isPending: false }),
}));

describe("RestartVhostDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("gives its node picker an accessible name and disables restart before selection", () => {
    renderWithProviders(
      <RestartVhostDialog
        vhost={{ name: "demo", cluster_state: { "rabbit@one": "running" } } as never}
        open
        onOpenChange={vi.fn()}
        apiClient={{} as never}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Node" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Restart" })).toBeDisabled();
  });

  it("restarts the selected vhost node and closes after success", async () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <RestartVhostDialog
        vhost={{ name: "demo", cluster_state: { "rabbit@one": "running" } } as never}
        open
        onOpenChange={onOpenChange}
        apiClient={{} as never}
      />,
    );

    await userEvent.click(screen.getByRole("combobox", { name: "Node" }));
    await userEvent.click(screen.getByRole("option", { name: "rabbit@one" }));
    await userEvent.click(screen.getByRole("button", { name: "Restart" }));

    expect(mutate).toHaveBeenCalledWith(
      { vhost: "demo", node: "rabbit@one" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );

    const callbacks = mutate.mock.calls[0]?.[1] as { onSuccess?: () => void } | undefined;
    callbacks?.onSuccess?.();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("clears a selected node when its controlled dialog closes", async () => {
    const onOpenChange = vi.fn();
    const view = renderWithProviders(
      <RestartVhostDialog
        vhost={{ name: "demo", cluster_state: { "rabbit@one": "running" } } as never}
        open
        onOpenChange={onOpenChange}
        apiClient={{} as never}
      />,
    );

    await userEvent.click(screen.getByRole("combobox", { name: "Node" }));
    await userEvent.click(screen.getByRole("option", { name: "rabbit@one" }));
    expect(screen.getByRole("button", { name: "Restart" })).toBeEnabled();

    view.rerender(
      <RestartVhostDialog
        vhost={{ name: "demo", cluster_state: { "rabbit@one": "running" } } as never}
        open={false}
        onOpenChange={onOpenChange}
        apiClient={{} as never}
      />,
    );
    view.rerender(
      <RestartVhostDialog
        vhost={{ name: "demo", cluster_state: { "rabbit@one": "running" } } as never}
        open
        onOpenChange={onOpenChange}
        apiClient={{} as never}
      />,
    );

    expect(screen.getByRole("button", { name: "Restart" })).toBeDisabled();
  });
});
