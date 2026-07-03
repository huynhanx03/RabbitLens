import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { TraceDetailPage } from "./trace-detail-page";

const client = { request: vi.fn() };

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual("@tanstack/react-router")),
  Link: ({ children }: { children: React.ReactNode }) => <a href="/test">{children}</a>,
  useRouteContext: () => ({ apiClient: client }),
}));

describe("TraceDetailPage", () => {
  it("loads one trace using its complete identity", async () => {
    client.request.mockResolvedValue({
      vhost: "/",
      name: "audit",
      format: "json",
      pattern: "publish.#",
      max_payload_bytes: 4096,
      tracer_connection_username: "observer",
      queue: { name: "amq.gen-trace", messages: 3 },
    });

    renderWithProviders(
      <TraceDetailPage node="rabbit@node" vhost="/" name="audit" />,
    );

    await waitFor(() => expect(screen.getByText("publish.#")).toBeVisible());
    expect(screen.getByText("observer")).toBeVisible();
    expect(client.request).toHaveBeenCalledWith(
      "/traces/node/rabbit%40node/%2F/audit",
      expect.any(Object),
    );
  });
});
