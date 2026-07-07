import { beforeEach, describe, expect, it, vi } from "vitest";
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
  beforeEach(() => {
    mockClient.request.mockReset();
  });

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

    // Wait for header metadata and merged properties
    await waitFor(() => {
      expect(screen.getByText("guest")).toBeInTheDocument();
      expect(screen.getByText("AMQP 0-9-1")).toBeInTheDocument();
      expect(screen.getByText("Properties")).toBeInTheDocument();
    });

    // Check channels table
    await waitFor(() => {
      expect(screen.getByText("127.0.0.1:5672 -> 192.168.1.10:42356 (1)")).toBeInTheDocument();
    });
  });

  it("loads sessions instead of channels for AMQP 1.0 connections", async () => {
    mockClient.request.mockImplementation((url: string) => {
      if (url.endsWith("/sessions")) {
        return Promise.resolve([{
          channel_number: 7,
          incoming_links: [{ link_name: "publisher-link", target_address: "orders", credit: 20 }],
          outgoing_links: [{ link_name: "consumer-link", source_address: "orders", queue_name: "orders", credit: 30 }],
        }]);
      }
      if (url.includes("/channels")) {
        throw new Error("AMQP 1.0 must not request channels");
      }
      return Promise.resolve({ ...mockConnection, protocol: "AMQP 1-0" });
    });

    render(
      <ConnectionDetailPage
        name="amqp10-client"
        channelsSearch={{ page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false }}
      />,
      { wrapper: createWrapper() },
    );

    expect(await screen.findByText("AMQP 1.0 sessions")).toBeVisible();
    expect(await screen.findByText("publisher-link")).toBeVisible();
    expect(screen.getByText("consumer-link")).toBeVisible();
    expect(mockClient.request).toHaveBeenCalledWith(
      "/connections/amqp10-client/sessions",
      expect.anything(),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(
      mockClient.request.mock.calls.some(([url]) => String(url).includes("/channels")),
    ).toBe(false);
  });

  it("shows operational network authentication and protocol limits", async () => {
    mockClient.request.mockImplementation((url: string) => {
      if (url.includes("/channels")) return Promise.resolve(mockPaginatedChannels);
      return Promise.resolve({ ...mockConnection, auth_mechanism: "PLAIN" });
    });

    render(
      <ConnectionDetailPage
        name={mockConnection.name}
        channelsSearch={{ page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false }}
      />,
      { wrapper: createWrapper() },
    );

    expect(await screen.findByText("Properties")).toBeVisible();
    expect(screen.getByText("127.0.0.1:5672")).toBeVisible();
    expect(screen.getByText("192.168.1.10:42356")).toBeVisible();
    expect(screen.getByText("PLAIN")).toBeVisible();
    expect(screen.getByText("131072")).toBeVisible();
    expect(screen.getByText("2047")).toBeVisible();
  });
});
