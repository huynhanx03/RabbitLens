import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ProcessDetailPage } from "./process-detail-page";

const client = { request: vi.fn() };

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual("@tanstack/react-router")),
  Link: ({ children }: { children: React.ReactNode }) => <a href="/test">{children}</a>,
  useRouteContext: () => ({ apiClient: client }),
}));

describe("ProcessDetailPage", () => {
  it("shows process relationships and stacktrace", async () => {
    client.request.mockResolvedValue({
      pid: "<0.123.0>",
      name: { name: "rabbit_reader", type: "rabbit_reader" },
      memory: 4096,
      reductions: 42,
      message_queue_len: 0,
      trap_exit: true,
      links: ["<0.1.0>"],
      monitors: [],
      monitored_by: [],
      current_stacktrace: "rabbit_reader:loop/1",
    });

    renderWithProviders(<ProcessDetailPage pid="<0.123.0>" />);
    await waitFor(() => expect(screen.getByText("rabbit_reader:loop/1")).toBeVisible());
    expect(screen.getByText("<0.1.0>")).toBeVisible();
  });
});
