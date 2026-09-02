import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StructuredKeyValue } from "./structured-key-value";

describe("StructuredKeyValue", () => {
  it("shows an explicit empty fallback instead of a blank operational section", () => {
    const { rerender } = render(<StructuredKeyValue entries={[]} />);
    expect(screen.getByText("—")).toBeVisible();

    rerender(<StructuredKeyValue emptyLabel="No arguments" entries={[]} />);
    expect(screen.getByText("No arguments")).toBeVisible();
  });

  it("renders entries with semantic tone and monospace data styling", () => {
    const { container } = render(
      <StructuredKeyValue
        className="diagnostics"
        entries={[
          { key: "State", value: "running", tone: "success" },
          { key: "PID", value: "<0.123.0>", monospace: true },
          { key: "Consumer", value: "", tone: "warning" },
        ]}
      />,
    );

    expect(screen.getByText("State")).toBeVisible();
    expect(screen.getByText("running")).toHaveClass("text-success");
    expect(screen.getByText("<0.123.0>")).toHaveClass("font-mono");
    expect(screen.getAllByText("—")).toHaveLength(1);
    expect(container.querySelector("dl")).toHaveClass("diagnostics");
  });

  it("maps every non-default semantic tone to the design token", () => {
    render(
      <StructuredKeyValue
        entries={[
          { key: "Warning", value: "slow", tone: "warning" },
          { key: "Danger", value: "blocked", tone: "danger" },
          { key: "Accent", value: "primary", tone: "accent" },
        ]}
      />,
    );

    expect(screen.getByText("slow")).toHaveClass("text-warning");
    expect(screen.getByText("blocked")).toHaveClass("text-destructive");
    expect(screen.getByText("primary")).toHaveClass("text-primary");
  });
});
