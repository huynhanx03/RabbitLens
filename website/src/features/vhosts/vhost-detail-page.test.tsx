import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { VhostDetailPage } from "./vhost-detail-page";

const client = { request: vi.fn(), requestVoid: vi.fn() };

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({ apiClient: client }),
    useParams: () => ({ name: "orders" }),
    useNavigate: () => vi.fn(),
    Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
  };
});

vi.mock("@/auth/permissions/permission-gate", () => ({
  usePermissionDecision: () => ({ kind: "allow" }),
}));

vi.mock("@/domains/admin/vhosts/vhost-query", () => ({
  useVhost: () => ({
    data: {
      name: "orders",
      description: "Order workflow",
      default_queue_type: "quorum",
      tracing: true,
      tags: ["production"],
      cluster_state: { "rabbit@a": "running" },
    },
    isPending: false,
    isError: false,
  }),
}));

describe("VhostDetailPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("presents queue configuration and scoped RabbitMQ resources", () => {
    renderWithProviders(<VhostDetailPage />);

    expect(screen.getByRole("heading", { name: "orders" })).toBeVisible();
    expect(screen.getByText("Order workflow")).toBeVisible();
    expect(screen.getByText("quorum")).toBeVisible();
    expect(screen.getByText("production")).toBeVisible();
    expect(screen.getByText("Queues and Streams")).toBeVisible();
    expect(screen.getByText("Exchanges")).toBeVisible();
  });

  it("opens the guarded restart operation with the selected vhost context", async () => {
    renderWithProviders(<VhostDetailPage />);

    await userEvent.click(screen.getByRole("button", { name: "Restart" }));

    expect(screen.getByRole("dialog", { name: "Restart Virtual Host on Node" })).toHaveTextContent(
      "orders",
    );
    expect(screen.getByRole("combobox", { name: "Node" })).toBeVisible();
  });
});
