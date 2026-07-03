import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { TopPage } from "./top-page";

const client = { request: vi.fn() };

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ children }: { children: React.ReactNode }) => (
      <a href="/test">{children}</a>
    ),
    useRouteContext: () => ({ apiClient: client }),
  };
});

describe("TopPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.request.mockImplementation((path: string) => {
      if (path === "/nodes") return Promise.resolve([{ name: "rabbit@node" }]);
      if (path === "/top/rabbit%40node?row_count=20") {
        return Promise.resolve({
          node: "rabbit@node",
          row_count: 20,
          processes: [
            {
              pid: "<0.123.0>",
              name: { name: "rabbit_reader", type: "rabbit_reader" },
              memory: 4096,
              reductions: 42,
              message_queue_len: 0,
            },
          ],
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
  });

  it("loads processes for the first RabbitMQ node", async () => {
    renderWithProviders(<TopPage />);

    await waitFor(() => expect(screen.getByText("<0.123.0>")).toBeVisible());
    expect(client.request).toHaveBeenCalledWith(
      "/top/rabbit%40node?row_count=20",
      expect.any(Object),
    );
    expect(screen.getByRole("link", { name: "ETS Tables" })).toBeVisible();
  });
});
