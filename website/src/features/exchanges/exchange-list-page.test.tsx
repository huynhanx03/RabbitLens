import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExchangeListPage } from "./exchange-list-page";
import { mockPaginatedExchanges } from "@/test/fixtures/exchanges";

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

describe("ExchangeListPage", () => {
  it("renders the exchanges table with data", async () => {
    mockClient.request.mockImplementation(async ({ path }) => {
      if (path === "/api/overview") {
        return { rates_mode: "detailed" };
      }
      return mockPaginatedExchanges;
    });

    render(
      <ExchangeListPage
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
      // Default exchange renamed in view model
      expect(screen.getByText("(AMQP default)")).toBeInTheDocument();
      expect(screen.getByText("amq.direct")).toBeInTheDocument();
    });

    // Check features badges
    expect(screen.getAllByText("D").length).toBeGreaterThan(0);
    expect(screen.getByText("AD")).toBeInTheDocument();
    expect(screen.getByText("I")).toBeInTheDocument();
  });
});
