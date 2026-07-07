import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { PageToolbar } from "./page-toolbar";

describe("PageToolbar", () => {
  it("groups primary and view controls in a responsive toolbar", () => {
    renderWithProviders(
      <PageToolbar
        ariaLabel="Connection controls"
        primary={<span>Search</span>}
        secondary={<button type="button">Columns</button>}
      />,
    );

    expect(
      screen.getByRole("toolbar", { name: "Connection controls" }),
    ).toHaveClass("rl-toolbar", "flex-col", "sm:flex-row");
    expect(
      screen.getByRole("toolbar", { name: "Connection controls" }),
    ).toHaveClass("border-0", "bg-transparent", "shadow-none");
    expect(screen.getByText("Search")).toBeVisible();
    expect(screen.getByRole("button", { name: "Columns" })).toBeVisible();
  });
});
