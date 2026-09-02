import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublishMessageDialog } from "./publish-message-dialog";

const mutate = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return { ...actual, useRouteContext: () => ({ apiClient: {} }) };
});

vi.mock("./exchange-query", () => ({
  usePublishMessageMutation: () => ({ mutate, error: null, isPending: false }),
}));

describe("PublishMessageDialog", () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  it("submits a typed RabbitMQ publish payload", async () => {
    const user = userEvent.setup();
    render(<PublishMessageDialog vhost="/" name="events" open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Routing key"), "orders.created");
    await user.click(screen.getByLabelText("Payload"));
    await user.paste('{"orderId":"42"}');
    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(mutate).toHaveBeenCalledWith(
      {
        vhost: "/",
        name: "events",
        request: {
          routing_key: "orders.created",
          payload_encoding: "string",
          payload: '{"orderId":"42"}',
          properties: {},
        },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );

    const callbacks = mutate.mock.calls[0]?.[1] as
      { onSuccess?: (result: { routed: boolean }) => void } | undefined;
    callbacks?.onSuccess?.({ routed: true });
    await waitFor(() => expect(screen.getByText("Message published")).toBeVisible());
  });

  it("warns when publishing does not route to a queue", async () => {
    const user = userEvent.setup();
    render(<PublishMessageDialog vhost="/" name="events" open onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Publish" }));
    const callbacks = mutate.mock.calls[0]?.[1] as
      { onSuccess?: (result: { routed: boolean }) => void } | undefined;
    callbacks?.onSuccess?.({ routed: false });

    await waitFor(() =>
      expect(screen.getByText("Publish error (no matching queues)")).toBeVisible(),
    );
  });

  it("clears a publish draft when its controlled dialog closes externally", async () => {
    const onOpenChange = vi.fn();
    const view = render(
      <PublishMessageDialog vhost="/" name="events" open onOpenChange={onOpenChange} />,
    );

    await userEvent.type(screen.getByLabelText("Routing key"), "orders.created");
    await userEvent.type(screen.getByLabelText("Payload"), "draft payload");
    view.rerender(
      <PublishMessageDialog vhost="/" name="events" open={false} onOpenChange={onOpenChange} />,
    );
    view.rerender(
      <PublishMessageDialog vhost="/" name="events" open onOpenChange={onOpenChange} />,
    );

    expect(screen.getByLabelText("Routing key")).toHaveValue("");
    expect(screen.getByLabelText("Payload")).toHaveValue("");
  });
});
