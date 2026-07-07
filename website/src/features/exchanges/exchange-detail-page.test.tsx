import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExchangeDetailPage } from "./exchange-detail-page";
import { mockExchange } from "@/test/fixtures/exchanges";

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

describe("ExchangeDetailPage", () => {
  it("renders exchange details", async () => {
    mockClient.request.mockImplementation(async (path: string) => {
      if (path.includes("/bindings")) {
        return [];
      }
      return mockExchange;
    });

    render(
      <ExchangeDetailPage
        vhost="/"
        name="amq.direct"
      />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(screen.getByText("direct")).toBeInTheDocument();
      expect(screen.getByText("D")).toBeInTheDocument();
    });

    // Check title
    expect(screen.getByText("amq.direct")).toBeInTheDocument();
  });
});
