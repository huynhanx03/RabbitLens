import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConnectionListPage } from "./connection-list-page";
import { mockPaginatedConnections } from "@/test/fixtures/connections";
import { renderWithProviders } from "@/test/render";

// Mock the API client
const mockClient = {
  request: vi.fn(),
  requestVoid: vi.fn(),
};
const navigate = vi.fn();
let currentSearch = { page: 1, pageSize: 10, name: "", useRegex: false, sortReverse: false };

// Mock router context
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ children, params }: { children: React.ReactNode; params: { name: string } }) => (
      <a href={`/connections/${encodeURIComponent(params.name)}`}>{children}</a>
    ),
    useRouteContext: () => ({
      apiClient: mockClient,
    }),
    useNavigate: () => navigate,
  };
});

vi.mock("@/app/routes/_authenticated/connections/index", () => ({
  Route: {
    fullPath: "/_authenticated/connections/",
    useSearch: () => currentSearch,
  },
}));

describe("ConnectionListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearch = { page: 1, pageSize: 10, name: "", useRegex: false, sortReverse: false };
  });

  it("renders the connections table with data", async () => {
    mockClient.request.mockResolvedValueOnce(mockPaginatedConnections);

    renderWithProviders(<ConnectionListPage />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("127.0.0.1:5672 -> 192.168.1.10:42356")).toBeInTheDocument();
    });

    // Check badges
    expect(screen.getAllByText("running").length).toBeGreaterThan(0);
    expect(screen.getByText("blocked")).toBeInTheDocument();

    // Check TLS column
    expect(screen.getAllByText("TLS").length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeVisible();
  });

  it("handles empty results gracefully", async () => {
    mockClient.request.mockResolvedValueOnce({
      items: [],
      filtered_count: 0,
      item_count: 0,
      page: 1,
      page_count: 0,
      page_size: 100,
      total_count: 0,
    });

    renderWithProviders(<ConnectionListPage />);

    await waitFor(() => {
      expect(screen.getByText("No active connections")).toBeInTheDocument();
    });
  });

  it("requires confirmation before force-closing a RabbitMQ connection", async () => {
    const user = userEvent.setup();
    mockClient.request.mockResolvedValueOnce(mockPaginatedConnections);
    mockClient.requestVoid.mockResolvedValueOnce(undefined);

    renderWithProviders(<ConnectionListPage />);

    const connection = mockPaginatedConnections.items[0];
    await screen.findByText(connection.name);
    await user.click(screen.getByRole("button", { name: `Force close ${connection.name}` }));

    expect(screen.getByRole("alertdialog")).toHaveTextContent(connection.name);
    await user.click(screen.getByRole("button", { name: "Force close" }));

    await waitFor(() =>
      expect(mockClient.requestVoid).toHaveBeenCalledWith(
        `/connections/${encodeURIComponent(connection.name)}`,
        expect.objectContaining({
          method: "DELETE",
          headers: { "X-Reason": "Closed via RabbitLens" },
        }),
      ),
    );
  });

  it("offers a clear filter action when a scoped query returns no connections", async () => {
    currentSearch = { page: 3, pageSize: 10, name: "blocked", useRegex: false, sortReverse: false };
    mockClient.request.mockResolvedValueOnce({
      items: [],
      filtered_count: 0,
      item_count: 0,
      page: 3,
      page_count: 3,
      page_size: 10,
      total_count: 9,
    });

    renderWithProviders(<ConnectionListPage />);

    const emptyTitle = await screen.findByText("No matching connections");
    await userEvent.click(within(emptyTitle.closest("td") as HTMLElement).getByRole("button"));

    const update = navigate.mock.calls[0]?.[0].search as (previous: object) => object;
    expect(update(currentSearch)).toEqual({
      page: 1,
      pageSize: 10,
      name: "",
      useRegex: false,
      sortReverse: false,
    });
  });
});
