import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QueueListPage } from "./queue-list-page";
import { mockPaginatedQueues } from "@/test/fixtures/queues";

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

describe("QueueListPage", () => {
  it("renders the queues table with data", async () => {
    mockClient.request.mockImplementation(async ({ path }) => {
      if (path === "/api/overview") {
        return { rates_mode: "detailed" }; // Enable stats
      }
      return mockPaginatedQueues;
    });

    render(
      <QueueListPage
        search={{
          page: 1,
          pageSize: 100,
          name: "",
          useRegex: false,
          sortReverse: false,
        }}
      />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(screen.getByText("my-queue")).toBeInTheDocument();
      expect(screen.getByText("quorum-queue")).toBeInTheDocument();
    });

    // Check features badges
    expect(screen.getAllByText("D").length).toBeGreaterThan(0);
    
    // Check queue stats
    const ready = screen.getByText("10"); // Ready messages
    const unacked = screen.getByText("5"); // Unacked messages
    const total = screen.getByText("15"); // Total messages
    expect(ready).toBeInTheDocument();
    expect(unacked).toBeInTheDocument();
    expect(total).toBeInTheDocument();
  });
});
