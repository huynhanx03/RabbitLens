import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QueueListPage } from "./queue-list-page";
import { mockPaginatedQueues } from "@/test/fixtures/queues";

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

describe("QueueListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the queues table with data", async () => {
    mockClient.request.mockImplementation(async (path: string) => {
      if (path === "/overview") {
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

  it("writes normalized filters to route search and opens a clicked queue", async () => {
    mockClient.request.mockImplementation(async (path: string) =>
      path === "/overview" ? { rates_mode: "detailed" } : mockPaginatedQueues,
    );
    render(
      <QueueListPage
        search={{
          page: 2,
          pageSize: 100,
          name: "",
          useRegex: false,
          sortReverse: false,
        }}
      />,
      { wrapper: createWrapper() },
    );

    await screen.findByText("my-queue");
    await userEvent.type(screen.getByLabelText("Filter by name"), "  orders  ");
    await userEvent.click(screen.getByRole("button", { name: "Filter" }));

    expect(navigate).toHaveBeenCalledWith({ search: expect.any(Function) });
    const filterUpdate = navigate.mock.calls[0]?.[0].search as (previous: object) => object;
    expect(filterUpdate({ page: 2, pageSize: 100, sortReverse: false })).toEqual({
      page: 1,
      pageSize: 100,
      sortReverse: false,
      name: "orders",
      useRegex: false,
    });

    await userEvent.click(screen.getByText("my-queue"));
    expect(navigate).toHaveBeenLastCalledWith({
      to: "/queues/$vhost/$name",
      params: { vhost: "/", name: "my-queue" },
    });
  });

  it("keeps an invalid regex local instead of changing the queue route search", async () => {
    mockClient.request.mockImplementation(async (path: string) =>
      path === "/overview" ? { rates_mode: "detailed" } : mockPaginatedQueues,
    );
    render(
      <QueueListPage
        search={{ page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false }}
      />,
      { wrapper: createWrapper() },
    );

    await screen.findByText("my-queue");
    await userEvent.click(screen.getByLabelText("Filter by name"));
    await userEvent.paste("[");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Filter" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid regular expression.");
    expect(navigate).not.toHaveBeenCalled();
  });
});
