import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MessageInspector } from "./message-inspector";

const mockClient = {
  request: vi.fn(),
  requestVoid: vi.fn(),
};

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({ apiClient: mockClient }),
  };
});

function renderInspector(props: Partial<React.ComponentProps<typeof MessageInspector>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MessageInspector vhost="/" name="my-queue" {...props} />
    </QueryClientProvider>,
  );
}

describe("MessageInspector", () => {
  it("loads a bounded, requeued snapshot and renders its payload", async () => {
    mockClient.request.mockResolvedValueOnce([
      {
        payload_bytes: 18,
        redelivered: false,
        exchange: "orders",
        routing_key: "order.created",
        message_count: 3,
        properties: { content_type: "application/json" },
        payload: '{"orderId":"42"}',
        payload_encoding: "string",
      },
    ]);

    renderInspector();
    await userEvent.click(screen.getByRole("button", { name: "Load snapshot" }));

    await waitFor(() => {
      expect(mockClient.request).toHaveBeenCalledWith(
        "/queues/%2F/my-queue/get",
        expect.anything(),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            count: 5,
            ackmode: "ack_requeue_true",
            encoding: "auto",
            truncate: 50000,
          }),
        }),
      );
    });
    expect(screen.getByText('{"orderId":"42"}')).toBeVisible();
    expect(screen.getByText("order.created")).toBeVisible();
  });

  it("clears results locally and exposes tracing only when available", async () => {
    const onOpenTracing = vi.fn();
    mockClient.request.mockResolvedValueOnce([
      {
        payload_bytes: 4,
        redelivered: true,
        exchange: "",
        routing_key: "my-queue",
        message_count: 0,
        properties: {},
        payload: "test",
        payload_encoding: "string",
      },
    ]);

    renderInspector({ tracingAvailable: true, onOpenTracing });
    await userEvent.click(screen.getByRole("button", { name: "Load snapshot" }));
    expect(await screen.findByText("test")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Clear snapshot" }));
    expect(screen.queryByText("test")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open live tracing" }));
    expect(onOpenTracing).toHaveBeenCalledOnce();
  });
});

