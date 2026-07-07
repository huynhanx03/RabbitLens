import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { SectionCard } from "./section-card";

describe("SectionCard", () => {
  it("renders a labelled premium section with an action", () => {
    renderWithProviders(
      <SectionCard
        title="Properties"
        description="Connection metadata"
        action={<button type="button">Copy</button>}
      >
        Content
      </SectionCard>,
    );

    expect(screen.getByRole("region", { name: "Properties" })).toHaveClass(
      "rl-panel",
      "rl-section-panel",
    );
    expect(screen.getByText("Properties").parentElement?.parentElement).toHaveClass(
      "rl-section-header",
    );
    expect(screen.getByRole("button", { name: "Copy" })).toBeVisible();
  });
});
