import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MoveMessagesDialog } from "./move-messages-dialog";

const client = { requestVoid: vi.fn() };
vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual("@tanstack/react-router")),
  useRouteContext: () => ({ apiClient: client }),
}));

function renderDialog(open = true, onOpenChange = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MoveMessagesDialog
        open={open}
        onOpenChange={onOpenChange}
        vhost="/"
        sourceQueue="orders"
        queueType="classic"
      />
    </QueryClientProvider>,
  );
}

describe("MoveMessagesDialog", () => {
  beforeEach(() => {
    client.requestVoid.mockReset();
  });

  it("rejects moving a queue into itself", async () => {
    renderDialog();
    await userEvent.type(screen.getByLabelText("Destination queue"), "orders");
    await userEvent.click(screen.getByRole("button", { name: "Move messages" }));
    expect(screen.getByText("Choose a different destination queue.")).toBeVisible();
    expect(client.requestVoid).not.toHaveBeenCalled();
  });

  it("creates a temporary same-vhost shovel", async () => {
    client.requestVoid.mockResolvedValue(undefined);
    renderDialog();
    await userEvent.type(screen.getByLabelText("Destination queue"), "archive");
    await userEvent.click(screen.getByRole("button", { name: "Move messages" }));
    expect(client.requestVoid).toHaveBeenCalledWith(
      expect.stringMatching(/^\/parameters\/shovel\/%2F\/rabbitlens-move-orders-/),
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("clears its destination and validation error when its controlled dialog closes", async () => {
    const onOpenChange = vi.fn();
    const view = renderDialog(true, onOpenChange);

    await userEvent.type(screen.getByLabelText("Destination queue"), "orders");
    await userEvent.click(screen.getByRole("button", { name: "Move messages" }));
    expect(screen.getByText("Choose a different destination queue.")).toBeVisible();

    view.rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MoveMessagesDialog
          open={false}
          onOpenChange={onOpenChange}
          vhost="/"
          sourceQueue="orders"
          queueType="classic"
        />
      </QueryClientProvider>,
    );
    view.rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MoveMessagesDialog
          open
          onOpenChange={onOpenChange}
          vhost="/"
          sourceQueue="orders"
          queueType="classic"
        />
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText("Destination queue")).toHaveValue("");
    expect(screen.queryByText("Choose a different destination queue.")).not.toBeInTheDocument();
  });
});
