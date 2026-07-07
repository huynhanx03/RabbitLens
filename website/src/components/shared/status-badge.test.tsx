import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("uses semantic status tokens instead of feature-specific colors", () => {
    renderWithProviders(<StatusBadge variant="success">running</StatusBadge>);

    const badge = screen.getByText("running").closest("span");
    expect(badge).toHaveClass("rl-status-badge");
    expect(badge).toHaveAttribute("data-variant", "success");
  });

  it("can hide the decorative icon while keeping the status label", () => {
    renderWithProviders(
      <StatusBadge variant="warning" icon={false}>
        idle
      </StatusBadge>,
    );

    expect(screen.getByText("idle")).toBeVisible();
    expect(screen.getByText("warning:")).toHaveClass("sr-only");
  });
});
