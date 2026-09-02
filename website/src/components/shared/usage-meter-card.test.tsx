import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UsageMeterCard } from "./usage-meter-card";

describe("UsageMeterCard", () => {
  it("clamps an over-limit percentage and presents the normal quota meter", () => {
    const { container } = render(
      <UsageMeterCard
        footer="1,000 available"
        limit="1,000"
        percent={125}
        title="Connections"
        value="1,250"
      />,
    );

    expect(screen.getByText("Connections")).toBeVisible();
    expect(screen.getByText("1,250")).toBeVisible();
    expect(screen.getByText("/ 1,000")).toBeVisible();
    expect(screen.getByText("100%")).toBeVisible();
    expect(screen.getByText("1,000 available")).toBeVisible();
    expect(container.querySelector('[style="width: 100%;"]')).toHaveClass("bg-primary");
  });

  it("clamps a negative percentage and uses the warning design token", () => {
    const { container } = render(
      <UsageMeterCard percent={-5} status="warning" title="Queue memory" value="5 MiB" />,
    );

    expect(screen.getByText("5 MiB")).toHaveClass("text-warning");
    expect(screen.getByText("0.0%")).toBeVisible();
    expect(container.querySelector('[style="width: 0%;"]')).toHaveClass("bg-warning");
  });

  it("keeps a footer useful without a meter and handles unknown critical values", () => {
    render(
      <UsageMeterCard
        footer="Broker did not report a limit"
        status="critical"
        title="Disk free"
        value={null}
      />,
    );

    expect(screen.getByText("—")).toHaveClass("text-destructive");
    expect(screen.getByText("Broker did not report a limit")).toBeVisible();
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });

  it("supports a compact icon-only normal meter without optional metadata", () => {
    const { container } = render(
      <UsageMeterCard
        icon={<svg aria-label="Memory icon" />}
        percent={5}
        title="Memory"
        value="50 MiB"
      />,
    );

    expect(screen.getByLabelText("Memory icon")).toBeVisible();
    expect(screen.getByText("5.0%")).toBeVisible();
    expect(container.querySelector(".rl-icon-tile")).toBeVisible();
  });
});
