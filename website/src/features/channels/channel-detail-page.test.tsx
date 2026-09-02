import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { ApiError } from "@/api/api-error";
import { mockChannel } from "@/test/fixtures/channels";
import { ChannelDetailPage } from "./channel-detail-page";

const mockClient = { request: vi.fn(), requestVoid: vi.fn() };
const navigate = vi.fn();
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({ apiClient: mockClient }),
    useNavigate: () => navigate,
  };
});

describe("ChannelDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders identity, workload and properties", async () => {
    mockClient.request.mockResolvedValueOnce(mockChannel);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ChannelDetailPage name={mockChannel.name} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByRole("region", { name: "Consumers" })).toBeVisible());
    expect(screen.getByRole("heading", { name: mockChannel.name })).toBeVisible();
    expect(screen.getByRole("region", { name: "Consumers" })).toHaveTextContent("2");
    expect(screen.getByRole("region", { name: "Properties" })).toBeVisible();
    expect(screen.getAllByText("guest").length).toBeGreaterThan(0);
  });

  it("renders protocol diagnostics when RabbitMQ exposes them", async () => {
    mockClient.request.mockResolvedValueOnce({
      ...mockChannel,
      pending_raft_commands: 2,
      cached_segments: 4,
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ChannelDetailPage name={mockChannel.name} />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(screen.getByRole("region", { name: "Protocol diagnostics" })).toBeVisible(),
    );
    expect(screen.getByRole("region", { name: "Protocol diagnostics" })).toHaveTextContent("2");
    expect(screen.getByRole("region", { name: "Protocol diagnostics" })).toHaveTextContent("4");
  });

  it("returns to the normalized channel list from the header", async () => {
    const user = userEvent.setup();
    mockClient.request.mockResolvedValueOnce(mockChannel);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ChannelDetailPage name={mockChannel.name} />
      </QueryClientProvider>,
    );

    await screen.findByRole("region", { name: "Consumers" });
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(navigate).toHaveBeenCalledWith({
      to: "/channels",
      search: { page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false },
    });
  });

  it("returns to the normalized channel list when the channel no longer exists", async () => {
    const user = userEvent.setup();
    mockClient.request.mockRejectedValueOnce(
      new ApiError("not-found", 404, false, "The channel was closed"),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ChannelDetailPage name={mockChannel.name} />
      </QueryClientProvider>,
    );

    await screen.findByRole("button", { name: "Return to list" });
    await user.click(screen.getByRole("button", { name: "Return to list" }));

    expect(navigate).toHaveBeenCalledWith({
      to: "/channels",
      search: { page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false },
    });
  });
});
