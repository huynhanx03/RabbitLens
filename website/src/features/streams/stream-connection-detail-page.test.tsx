import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/api-error";
import { renderWithProviders } from "@/test/render";
import { StreamConnectionDetailPage } from "./stream-connection-detail-page";

const client = { request: vi.fn(), requestVoid: vi.fn() };
let connectionState = "running";
let usesTls = true;

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({ apiClient: client }),
    Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
  };
});

describe("StreamConnectionDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectionState = "running";
    usesTls = true;
    client.request.mockImplementation((path: string) => {
      if (path === "/stream/connections/%2F/stream-1") {
        return Promise.resolve({
          name: "stream-1",
          vhost: "/",
          node: "rabbit@a",
          user: "producer",
          state: connectionState,
          ssl: usesTls,
          protocol: "stream",
          connected_at: 1_710_000_000,
          client_properties: { product: "rabbitmq-stream-client" },
        });
      }
      if (path.endsWith("/publishers"))
        return Promise.resolve([{ publisher_id: 1, published: 42 }]);
      if (path.endsWith("/consumers")) return Promise.resolve([{ reference: "orders-consumer" }]);
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
  });

  it("renders connection state, TLS and raw publisher/consumer diagnostics", async () => {
    renderWithProviders(<StreamConnectionDetailPage vhost="/" name="stream-1" />);

    await waitFor(() => expect(screen.getByText("rabbit@a")).toBeVisible());
    expect(screen.getByRole("heading", { name: "stream-1" })).toBeVisible();
    expect(screen.getAllByText("running")).toHaveLength(2);
    expect(screen.getAllByText("TLS")).toHaveLength(2);
    expect(screen.getByText("rabbitmq-stream-client")).toBeVisible();
    expect(screen.getByText("orders-consumer")).toBeVisible();
  });

  it("keeps non-running stream connections visible without inventing TLS metadata", async () => {
    connectionState = "blocked";
    usesTls = false;
    renderWithProviders(<StreamConnectionDetailPage vhost="/" name="stream-1" />);

    expect((await screen.findAllByText("blocked"))[0]).toBeVisible();
    expect(screen.getByText("TLS")).toBeVisible();
    expect(screen.getByText("Unavailable")).toBeVisible();
    expect(document.querySelector("a[aria-label='Back']")).toHaveAttribute(
      "to",
      "/extensions/streams/connections",
    );
  });

  it("retries retryable publisher diagnostics without hiding the connection", async () => {
    const retryableError = new ApiError("network", undefined, true, "broker unavailable");
    client.request.mockImplementation((path: string) => {
      if (path === "/stream/connections/%2F/stream-1") {
        return Promise.resolve({
          name: "stream-1",
          vhost: "/",
          node: "rabbit@a",
          user: "producer",
          state: "running",
          ssl: true,
          protocol: "stream",
          connected_at: 1_710_000_000,
        });
      }
      if (path.endsWith("/publishers")) return Promise.reject(retryableError);
      if (path.endsWith("/consumers")) return Promise.resolve([]);
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
    renderWithProviders(<StreamConnectionDetailPage vhost="/" name="stream-1" />);

    await screen.findByText("rabbit@a");
    await userEvent.click(await screen.findByRole("button", { name: "Try again" }));

    await waitFor(() =>
      expect(
        client.request.mock.calls.filter(([path]) => String(path).endsWith("/publishers")),
      ).toHaveLength(2),
    );
    expect(screen.getByText("rabbit@a")).toBeVisible();
  });
});
