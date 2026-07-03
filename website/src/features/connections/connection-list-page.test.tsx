import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { ConnectionListPage } from "./connection-list-page";
import { mockPaginatedConnections } from "@/test/fixtures/connections";
import { renderWithProviders } from "@/test/render";

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
    Link: ({ children, params }: { children: React.ReactNode; params: { name: string } }) => (
      <a href={`/connections/${encodeURIComponent(params.name)}`}>{children}</a>
    ),
    useRouteContext: () => ({
      apiClient: mockClient,
    }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock("@/app/routes/_authenticated/connections/index", () => ({
  Route: {
    useSearch: () => ({ page: 1, pageSize: 10, name: "", useRegex: false, sortReverse: false }),
  }
}));

describe("ConnectionListPage", () => {
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
    expect(
      screen.queryByRole("heading", { level: 1 }),
    ).not.toBeInTheDocument();
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
});
