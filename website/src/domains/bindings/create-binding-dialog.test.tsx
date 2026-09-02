import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateBindingDialog } from "./create-binding-dialog";

const bindingMutation = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  useRouteContext: () => ({ apiClient: {} }),
}));
vi.mock("./binding-query", () => ({
  useCreateBindingMutation: () => ({
    error: null,
    isPending: false,
    mutate: bindingMutation.mutate,
  }),
}));
vi.mock("@/components/shared/arguments-editor", () => ({
  ArgumentsEditor: () => <div data-testid="arguments-editor" />,
}));

describe("CreateBindingDialog", () => {
  beforeEach(() => bindingMutation.mutate.mockClear());

  it("clears a draft after an external close before another binding is created", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <CreateBindingDialog
        mode="to-queue"
        onOpenChange={onOpenChange}
        open
        resourceName="orders"
        vhost="/"
      />,
    );

    await user.type(screen.getByLabelText("Source"), "orders.events");
    await user.type(screen.getByLabelText("Routing key"), "orders.created");
    expect(screen.getByLabelText("Source")).toHaveValue("orders.events");

    rerender(
      <CreateBindingDialog
        mode="to-queue"
        onOpenChange={onOpenChange}
        open={false}
        resourceName="orders"
        vhost="/"
      />,
    );
    rerender(
      <CreateBindingDialog
        mode="to-queue"
        onOpenChange={onOpenChange}
        open
        resourceName="orders"
        vhost="/"
      />,
    );

    expect(screen.getByLabelText("Source")).toHaveValue("");
    expect(screen.getByLabelText("Routing key")).toHaveValue("");
  });

  it.each([
    {
      destination: "orders",
      destinationType: "q",
      mode: "to-queue" as const,
      resourceName: "orders",
      source: "orders.events",
    },
    {
      destination: "orders.events",
      destinationType: "e",
      mode: "to-exchange" as const,
      resourceName: "orders.events",
      source: "orders.commands",
    },
    {
      destination: "orders",
      destinationType: "q",
      mode: "from-exchange" as const,
      resourceName: "orders.events",
      source: "orders.events",
    },
  ])("maps $mode bindings to the management API mutation", async (expected) => {
    const user = userEvent.setup();
    render(
      <CreateBindingDialog
        mode={expected.mode}
        onOpenChange={vi.fn()}
        open
        resourceName={expected.resourceName}
        vhost="/"
      />,
    );

    const source = screen.queryByLabelText("Source");
    if (source) await user.type(source, expected.source);
    const destination = screen.queryByLabelText("Destination");
    if (destination) await user.type(destination, expected.destination);
    await user.type(screen.getByLabelText("Routing key"), "orders.created");
    await user.click(screen.getByRole("button", { name: "Bind" }));

    expect(bindingMutation.mutate).toHaveBeenCalledWith(
      {
        destination: expected.destination,
        destinationType: expected.destinationType,
        exchange: expected.source,
        request: { arguments: {}, routing_key: "orders.created" },
        vhost: "/",
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
