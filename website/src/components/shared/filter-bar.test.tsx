import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { FilterBar } from "./filter-bar";

describe("FilterBar", () => {
  it("submits a trimmed name and can clear the active filter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(
      <FilterBar name="client" useRegex={false} onSubmit={onSubmit} />,
    );

    const input = screen.getByRole("textbox", { name: "Filter by name" });
    await user.clear(input);
    await user.type(input, "  worker  {Enter}");
    expect(onSubmit).toHaveBeenLastCalledWith("worker", false);

    await user.click(screen.getByRole("button", { name: "Clear filter" }));
    expect(onSubmit).toHaveBeenLastCalledWith("", false);
  });

  it("rejects an invalid regular expression", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(
      <FilterBar name="[" useRegex onSubmit={onSubmit} />,
    );

    await user.click(screen.getByRole("button", { name: "Filter" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid regular expression",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
