import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { StreamConnectionListPage } from "./stream-connection-list-page";

const client = { request: vi.fn(), requestVoid: vi.fn() };
const navigate = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({ apiClient: client }),
    useNavigate: () => navigate,
    Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
  };
});

const search = { page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false };

describe("StreamConnectionListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders stream connections and navigates from row and filter actions", async () => {
    client.request.mockResolvedValue({
      items: [
        {
          name: "stream-1",
          vhost: "/",
          user: "producer",
          state: "running",
          ssl: true,
          protocol: "stream",
          client_properties: { connection_name: "orders-writer" },
        },
      ],
      filtered_count: 1,
      item_count: 1,
      page: 1,
      page_count: 1,
      page_size: 100,
      total_count: 1,
    });

    renderWithProviders(<StreamConnectionListPage search={search} />);

    await waitFor(() => expect(screen.getByText("orders-writer")).toBeVisible());
    expect(screen.getByText("running")).toBeVisible();
    expect(screen.getAllByText("TLS")).toHaveLength(2);

    await userEvent.click(screen.getByText("orders-writer"));
    expect(navigate).toHaveBeenCalledWith({
      to: "/extensions/streams/connections/$vhost/$name",
      params: { vhost: "/", name: "stream-1" },
    });

    await userEvent.type(screen.getByRole("textbox", { name: "Filter by name" }), "orders");
    await userEvent.click(screen.getByRole("button", { name: "Filter" }));
    expect(navigate).toHaveBeenLastCalledWith({
      to: "/extensions/streams/connections",
      search: { ...search, name: "orders", useRegex: false, page: 1 },
    });
  });

  it("shows the localized empty state", async () => {
    client.request.mockResolvedValue({
      items: [],
      filtered_count: 0,
      item_count: 0,
      page: 1,
      page_count: 0,
      page_size: 100,
      total_count: 0,
    });

    renderWithProviders(<StreamConnectionListPage search={search} />);

    expect(await screen.findByText("No stream connections")).toBeVisible();
  });
});
