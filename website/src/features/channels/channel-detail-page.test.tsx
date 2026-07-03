import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { mockChannel } from "@/test/fixtures/channels";
import { ChannelDetailPage } from "./channel-detail-page";

const mockClient = { request: vi.fn(), requestVoid: vi.fn() };
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({ apiClient: mockClient }),
    useNavigate: () => vi.fn(),
  };
});

describe("ChannelDetailPage", () => {
  it("renders identity, workload and properties", async () => {
    mockClient.request.mockResolvedValueOnce(mockChannel);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={queryClient}><ChannelDetailPage name={mockChannel.name} /></QueryClientProvider>);

    await waitFor(() => expect(screen.getByRole("region", { name: "Consumers" })).toBeVisible());
    expect(screen.getByRole("heading", { name: mockChannel.name })).toBeVisible();
    expect(screen.getByRole("region", { name: "Consumers" })).toHaveTextContent("2");
    expect(screen.getByRole("region", { name: "Properties" })).toBeVisible();
    expect(screen.getAllByText("guest").length).toBeGreaterThan(0);
  });
});
