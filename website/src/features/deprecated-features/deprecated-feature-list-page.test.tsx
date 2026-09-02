import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DeprecatedFeatureListPage } from "./deprecated-feature-list-page";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return { ...actual, useRouteContext: () => ({ apiClient: {} }) };
});

vi.mock("@/domains/admin/deprecated-features/deprecated-feature-query", () => ({
  useDeprecatedFeatures: () => ({
    data: [
      {
        name: "classic_mirrored_queue_version",
        desc: "Classic mirrored queue support",
        docs_url: "https://rabbitmq.com/docs/classic-queues",
      },
      { name: "global_qos", desc: "Global QoS setting" },
    ],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe("DeprecatedFeatureListPage", () => {
  it("filters deprecated features and opens documentation safely", async () => {
    renderWithProviders(<DeprecatedFeatureListPage />);

    expect(screen.getByText("global_qos")).toBeVisible();
    const docs = screen.getByRole("link", { name: "Read more" });
    expect(docs).toHaveAttribute("href", "https://rabbitmq.com/docs/classic-queues");
    expect(docs).toHaveAttribute("rel", "noreferrer");

    await userEvent.type(screen.getByRole("textbox", { name: "Filter by name" }), "qos");
    await userEvent.click(screen.getByRole("button", { name: "Filter" }));

    expect(screen.getByText("global_qos")).toBeVisible();
    expect(screen.queryByText("classic_mirrored_queue_version")).not.toBeInTheDocument();
  });
});
