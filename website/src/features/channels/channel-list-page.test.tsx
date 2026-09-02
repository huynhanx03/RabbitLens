import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { mockPaginatedChannels } from "@/test/fixtures/channels";
import { ChannelListPage } from "./channel-list-page";

const mockClient = { request: vi.fn(), requestVoid: vi.fn() };
const navigate = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ children, params }: { children: React.ReactNode; params: { name: string } }) => (
      <a href={`/channels/${encodeURIComponent(params.name)}`}>{children}</a>
    ),
    useRouteContext: () => ({ apiClient: mockClient }),
    useNavigate: () => navigate,
  };
});

vi.mock("@/app/routes/_authenticated/channels/index", () => ({
  Route: {
    fullPath: "/_authenticated/channels/",
    useSearch: () => ({ page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false }),
  },
}));

describe("ChannelListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the real channel list route data", async () => {
    mockClient.request.mockResolvedValueOnce(mockPaginatedChannels);
    renderWithProviders(<ChannelListPage />);

    await waitFor(() =>
      expect(screen.getByText(mockPaginatedChannels.items[0].name)).toBeVisible(),
    );
    expect(screen.getByRole("table", { name: "RabbitMQ channels" })).toBeVisible();
    expect(screen.getByText("1 channel")).toBeVisible();
  });

  it("writes filter and sort state to the route, then opens the clicked channel row", async () => {
    const user = userEvent.setup();
    mockClient.request.mockResolvedValueOnce(mockPaginatedChannels);
    renderWithProviders(<ChannelListPage />);

    await screen.findByText(mockPaginatedChannels.items[0].name);
    await user.type(screen.getByLabelText("Filter by name"), "  client  ");
    await user.click(screen.getByRole("button", { name: "Filter" }));

    const filterUpdate = navigate.mock.calls[0]?.[0].search as (previous: object) => object;
    expect(filterUpdate({ page: 2, pageSize: 100, sortReverse: false })).toEqual({
      page: 1,
      pageSize: 100,
      sortReverse: false,
      name: "client",
      useRegex: false,
    });

    await user.click(screen.getByRole("button", { name: "State" }));
    const sortUpdate = navigate.mock.calls[1]?.[0].search as (previous: object) => object;
    expect(sortUpdate({ page: 2, pageSize: 100, name: "", useRegex: false })).toEqual({
      page: 1,
      pageSize: 100,
      name: "",
      useRegex: false,
      sort: "state",
      sortReverse: false,
    });

    await user.click(screen.getByText("running"));
    expect(navigate).toHaveBeenLastCalledWith({
      to: "/channels/$name",
      params: { name: mockPaginatedChannels.items[0].name },
      search: { page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false },
    });
  });
});
