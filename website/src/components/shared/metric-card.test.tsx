import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricCard } from "./metric-card";
import { Activity } from "lucide-react";

describe("MetricCard", () => {
  it("preserves zero and distinguishes missing values", () => {
    const { rerender } = render(<MetricCard title="Queues" value={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();

    rerender(<MetricCard title="Queues" value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("exposes icon, helper and non-color status text", () => {
    render(
      <MetricCard
        title="Connections"
        value={12}
        icon={<Activity data-testid="metric-icon" />}
        description="Active clients"
        status="warning"
        statusLabel="Needs attention"
      />,
    );

    expect(screen.getByRole("region", { name: "Connections" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Connections" })).toHaveClass(
      "rl-metric-card",
    );
    expect(screen.getByText("12")).toHaveClass("rl-metric-value");
    expect(screen.getByTestId("metric-icon")).toBeVisible();
    expect(screen.getByText("Active clients")).toBeVisible();
    expect(screen.getByText("Needs attention")).toHaveClass("sr-only");
  });

  it("uses an explicit unavailable label", () => {
    render(
      <MetricCard
        title="Queues"
        value={null}
        isUnavailable
        unavailableLabel="Unavailable"
      />,
    );
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });
});
