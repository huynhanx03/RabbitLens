import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QueueDetailPage } from "./queue-detail-page";
import { mockQueue } from "@/test/fixtures/queues";

const mockClient = {
  request: vi.fn(),
  requestVoid: vi.fn(),
};

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({
      apiClient: mockClient,
      auth: { user: { name: "admin", tags: ["administrator"] } },
    }),
    useNavigate: () => vi.fn(),
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("QueueDetailPage", () => {
  it("renders queue details", async () => {
    mockClient.request.mockImplementation(async (path: string) => {
      if (path === "/extensions") return [{ javascript_src: "shovel.js" }];
      if (path.includes("/bindings")) {
        return [];
      }
      return mockQueue;
    });

    render(
      <QueueDetailPage
        vhost="/"
        name="my-queue"
      />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      // Type
      expect(screen.getByText("classic")).toBeVisible();
      // Node
      expect(screen.getByText("rabbit@localhost")).toBeVisible();
      // Features
      expect(screen.getByText("D")).toBeInTheDocument();
      // State Badge
      expect(screen.getByText("running")).toBeInTheDocument();
    });

    expect(screen.getByRole("region", { name: "Message inspector" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Load snapshot" })).toBeVisible();
    expect(screen.queryByRole("table", { name: "Message activity" })).not.toBeInTheDocument();

    // Check message counts
    const readyCounts = screen.getAllByText("10"); // One could be the chart, one could be the stat block, we expect at least 1
    expect(readyCounts.length).toBeGreaterThan(0);
    
    const unackedCounts = screen.getAllByText("5");
    expect(unackedCounts.length).toBeGreaterThan(0);
    
    const totalCounts = screen.getAllByText("15");
    expect(totalCounts.length).toBeGreaterThan(0);
  });

  it("opens queue publishing with the default-exchange routing key locked", async () => {
    mockClient.request.mockImplementation(async (path: string) => {
      if (path === "/extensions") return [{ javascript_src: "shovel.js" }];
      if (path.includes("/bindings")) return [];
      return mockQueue;
    });

    render(<QueueDetailPage vhost="/" name="my-queue" />, { wrapper: createWrapper() });

    await userEvent.click(await screen.findByRole("button", { name: "Publish message" }));
    expect(screen.getByLabelText("Routing key")).toHaveValue("my-queue");
    expect(screen.getByLabelText("Routing key")).toBeDisabled();
  });

  it("offers move messages only when Shovel Management is available", async () => {
    mockClient.request.mockImplementation(async (path: string) => {
      if (path === "/extensions") return [{ javascript_src: "shovel.js" }];
      if (path.includes("/bindings")) return [];
      return mockQueue;
    });
    render(<QueueDetailPage vhost="/" name="my-queue" />, { wrapper: createWrapper() });
    expect(await screen.findByRole("button", { name: "Move messages" })).toBeVisible();
  });

  it("offers synchronization actions only for legacy mirrored queues", async () => {
    mockClient.request.mockImplementation(async (path: string) => {
      if (path === "/extensions") return [];
      if (path.includes("/bindings")) return [];
      return { ...mockQueue, slave_nodes: ["rabbit@two"], synchronised_slave_nodes: [] };
    });
    render(<QueueDetailPage vhost="/" name="my-queue" />, { wrapper: createWrapper() });
    expect(await screen.findByRole("button", { name: "Synchronize mirrors" })).toBeVisible();
  });
});
