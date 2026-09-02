import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { ExchangeDetailPage } from "./exchange-detail-page";
import { mockExchange } from "@/test/fixtures/exchanges";

const mockClient = {
  request: vi.fn(),
  requestVoid: vi.fn(),
};
const navigate = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({
      apiClient: mockClient,
    }),
    useNavigate: () => navigate,
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders exchange details", async () => {
    mockClient.request.mockImplementation(async (path: string) => {
      if (path.includes("/bindings")) {
        return [];
      }
      return mockExchange;
    });

    render(<ExchangeDetailPage vhost="/" name="amq.direct" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("direct")).toBeInTheDocument();
      expect(screen.getByText("D")).toBeInTheDocument();
    });

    // Check title
    expect(screen.getByText("amq.direct")).toBeInTheDocument();
  });

  it("requires confirmation before deleting a named exchange", async () => {
    const user = userEvent.setup();
    mockClient.request.mockImplementation(async (path: string) =>
      path.includes("/bindings") ? [] : mockExchange,
    );
    mockClient.requestVoid.mockResolvedValueOnce(undefined);
    render(<ExchangeDetailPage vhost="/" name="amq.direct" />, { wrapper: createWrapper() });

    await screen.findByText("amq.direct");
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("amq.direct");
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(mockClient.requestVoid).toHaveBeenCalledWith("/exchanges/%2F/amq.direct", {
        method: "DELETE",
      }),
    );
    expect(navigate).toHaveBeenCalledWith({
      to: "/exchanges",
      search: { page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false },
    });
  });

  it("protects the AMQP default exchange from deletion", async () => {
    mockClient.request.mockImplementation(async (path: string) =>
      path.includes("/bindings") ? [] : { ...mockExchange, name: "" },
    );
    render(<ExchangeDetailPage vhost="/" name="" />, { wrapper: createWrapper() });

    expect(await screen.findByRole("heading", { name: "(AMQP default)" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });
});
