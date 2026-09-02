import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { PolicyDetailPage } from "./policy-detail-page";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({ apiClient: {} }),
    useParams: () => ({ vhost: "/", name: "ha-policy" }),
  };
});

vi.mock("@/domains/admin/policies/policy-query", () => ({
  usePolicy: () => ({
    data: {
      vhost: "/",
      name: "ha-policy",
      pattern: "^orders\\.",
      "apply-to": "queues",
      priority: 5,
      definition: { "ha-mode": "all" },
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe("PolicyDetailPage", () => {
  it("renders the policy scope, priority and definition", () => {
    renderWithProviders(<PolicyDetailPage />);

    expect(screen.getByRole("heading", { name: "ha-policy" })).toBeVisible();
    expect(screen.getByText("^orders\\.")).toBeVisible();
    expect(screen.getByText("queues")).toBeVisible();
    expect(screen.getByText("5")).toBeVisible();
    expect(screen.getByText(/"ha-mode": "all"/)).toBeVisible();
  });
});
