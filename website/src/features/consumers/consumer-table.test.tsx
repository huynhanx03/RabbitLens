import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ConsumerTable } from "./consumer-table";

describe("ConsumerTable", () => {
  it("shows operational consumer ownership and delivery settings", () => {
    renderWithProviders(<ConsumerTable consumers={[{
      consumer_tag: "worker-1",
      queue: { name: "orders", vhost: "/" },
      channel_details: { name: "client (1)", connection_name: "client" },
      ack_required: true,
      exclusive: false,
      prefetch_count: 100,
      active: true,
      activity_status: "up",
      consumer_timeout: 1800000,
      arguments: { "x-priority": 5 },
    }]} />);

    expect(screen.getByText("worker-1")).toBeVisible();
    expect(screen.getByRole("link", { name: "client (1)" })).toHaveAttribute("href", "/channels/client%20(1)");
    expect(screen.getByRole("link", { name: "orders" })).toHaveAttribute("href", "/queues/%2F/orders");
    expect(screen.getByText("100")).toBeVisible();
    expect(screen.getByText("Active")).toBeVisible();
  });

  it("renders an intentional empty state", () => {
    renderWithProviders(<ConsumerTable consumers={[]} />);
    expect(screen.getByText("No consumers.")).toBeVisible();
  });
});
