import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { mockPaginatedChannels } from "@/test/fixtures/channels";
import { ChannelListPage } from "./channel-list-page";

const mockClient = { request: vi.fn(), requestVoid: vi.fn() };

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ children, params }: { children: React.ReactNode; params: { name: string } }) => <a href={`/channels/${encodeURIComponent(params.name)}`}>{children}</a>,
    useRouteContext: () => ({ apiClient: mockClient }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock("@/app/routes/_authenticated/channels/index", () => ({
  Route: {
    fullPath: "/_authenticated/channels/",
    useSearch: () => ({ page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false }),
  },
}));

describe("ChannelListPage", () => {
  it("renders the real channel list route data", async () => {
    mockClient.request.mockResolvedValueOnce(mockPaginatedChannels);
    renderWithProviders(<ChannelListPage />);

    await waitFor(() => expect(screen.getByText(mockPaginatedChannels.items[0].name)).toBeVisible());
    expect(screen.getByRole("table", { name: "RabbitMQ channels" })).toBeVisible();
    expect(screen.getByText("1 channel")).toBeVisible();
  });
});
