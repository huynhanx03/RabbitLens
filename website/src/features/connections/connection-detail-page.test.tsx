import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectionDetailPage } from "./connection-detail-page";
import { mockConnection } from "@/test/fixtures/connections";
import { mockPaginatedChannels } from "@/test/fixtures/channels";

// Mock the API client
const mockClient = {
  request: vi.fn(),
  requestVoid: vi.fn(),
};

// Mock router context
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ children, params }: { children: React.ReactNode; params: { name: string } }) => <a href={`/channels/${encodeURIComponent(params.name)}`}>{children}</a>,
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

describe("ConnectionDetailPage", () => {
  it("renders connection details and channels", async () => {
    // API mock returns connection first, then channels
    mockClient.request.mockImplementation((url: string) => {
      if (url.includes("/channels")) {
        return Promise.resolve(mockPaginatedChannels);
      }
      return Promise.resolve(mockConnection);
    });

    render(
      <ConnectionDetailPage
        name="127.0.0.1:5672 -> 192.168.1.10:42356"
        channelsSearch={{
          page: 1,
          pageSize: 100,
          name: "",
          useRegex: false,
          sortReverse: false,
        }}
      />,
      { wrapper: createWrapper() },
    );

    // Wait for connection properties
    await waitFor(() => {
      expect(screen.getAllByText("guest")).toHaveLength(2);
      expect(screen.getAllByText("AMQP 0-9-1")).toHaveLength(2);
    });

    // Check channels table
    await waitFor(() => {
      expect(screen.getByText("127.0.0.1:5672 -> 192.168.1.10:42356 (1)")).toBeInTheDocument();
    });
  });
});
