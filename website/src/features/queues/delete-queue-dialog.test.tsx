import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DeleteQueueDialog } from "./delete-queue-dialog";

const mutate = vi.fn();
const navigate = vi.fn();
const onOpenChange = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({ apiClient: {} }),
    useNavigate: () => navigate,
  };
});

vi.mock("@/domains/queues/queue-query", () => ({
  useDeleteQueueMutation: () => ({ mutate, error: null, isPending: false }),
}));

describe("DeleteQueueDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits deletion safety conditions with the queue identity", async () => {
    renderWithProviders(
      <DeleteQueueDialog vhost="/" name="orders" open onOpenChange={onOpenChange} />,
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "Delete if unused" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Delete if empty" }));
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(mutate).toHaveBeenCalledWith(
      { vhost: "/", name: "orders", options: { ifUnused: true, ifEmpty: true } },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );

    const callbacks = mutate.mock.calls[0]?.[1] as { onSuccess?: () => void } | undefined;
    await act(async () => callbacks?.onSuccess?.());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(navigate).toHaveBeenCalledWith({
      to: "/queues",
      search: { page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false },
    });
  });

  it("resets deletion safety choices after an external close", async () => {
    const { rerender } = renderWithProviders(
      <DeleteQueueDialog vhost="/" name="orders" open onOpenChange={onOpenChange} />,
    );
    await userEvent.click(screen.getByRole("checkbox", { name: "Delete if unused" }));
    expect(screen.getByRole("checkbox", { name: "Delete if unused" })).toBeChecked();

    rerender(
      <DeleteQueueDialog vhost="/" name="orders" open={false} onOpenChange={onOpenChange} />,
    );
    rerender(<DeleteQueueDialog vhost="/" name="orders" open onOpenChange={onOpenChange} />);

    expect(screen.getByRole("checkbox", { name: "Delete if unused" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Delete if empty" })).not.toBeChecked();
  });
});
