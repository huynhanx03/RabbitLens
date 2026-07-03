import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
      expect(screen.getAllByText("classic")).toHaveLength(2);
      // Node
      expect(screen.getAllByText("rabbit@localhost")).toHaveLength(2);
      // Features
      expect(screen.getByText("D")).toBeInTheDocument();
      // State Badge
      expect(screen.getByText("running")).toBeInTheDocument();
    });

    // Check message counts
    const readyCounts = screen.getAllByText("10"); // One could be the chart, one could be the stat block, we expect at least 1
    expect(readyCounts.length).toBeGreaterThan(0);
    
    const unackedCounts = screen.getAllByText("5");
    expect(unackedCounts.length).toBeGreaterThan(0);
    
    const totalCounts = screen.getAllByText("15");
    expect(totalCounts.length).toBeGreaterThan(0);
  });
});
