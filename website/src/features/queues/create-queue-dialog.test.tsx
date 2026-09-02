import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { CreateQueueDialog } from "./create-queue-dialog";

const mutate = vi.fn();
const onOpenChange = vi.fn();

function getSubmitButton() {
  const submit = screen
    .getByRole("dialog")
    .querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!submit) throw new Error("Create Queue submit button is missing");
  return submit;
}

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return { ...actual, useRouteContext: () => ({ apiClient: {} }) };
});

vi.mock("@/domains/queues/queue-query", () => ({
  useCreateQueueMutation: () => ({ mutate, error: null, isPending: false }),
}));

describe("CreateQueueDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a durable stream queue with its required RabbitMQ argument", async () => {
    renderWithProviders(<CreateQueueDialog vhost="/" open onOpenChange={onOpenChange} />);

    await userEvent.type(screen.getByLabelText("Name"), "events");
    await userEvent.click(screen.getByLabelText("Type", { selector: "#type" }));
    await userEvent.click(screen.getByRole("option", { name: "Stream" }));
    await userEvent.click(getSubmitButton());

    expect(mutate).toHaveBeenCalledWith(
      {
        vhost: "/",
        name: "events",
        request: {
          node: undefined,
          durable: true,
          auto_delete: false,
          arguments: { "x-queue-type": "stream" },
        },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("shows form validation before a queue name can be submitted", async () => {
    renderWithProviders(<CreateQueueDialog vhost="/" open onOpenChange={onOpenChange} />);

    await userEvent.click(getSubmitButton());

    expect(await screen.findByText("Name is required")).toBeVisible();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("clears a queue draft after an external close", async () => {
    const { rerender } = renderWithProviders(
      <CreateQueueDialog vhost="/" open onOpenChange={onOpenChange} />,
    );
    await userEvent.type(screen.getByLabelText("Name"), "orders");

    rerender(<CreateQueueDialog vhost="/" open={false} onOpenChange={onOpenChange} />);
    rerender(<CreateQueueDialog vhost="/" open onOpenChange={onOpenChange} />);

    expect(screen.getByLabelText("Name")).toHaveValue("");
  });
});
