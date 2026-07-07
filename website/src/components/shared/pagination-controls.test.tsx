import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { PaginationControls } from "./pagination-controls";

describe("PaginationControls", () => {
  it("announces counts and keeps navigation within page bounds", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    renderWithProviders(
      <PaginationControls
        page={1}
        pageCount={3}
        pageSize={20}
        filteredCount={42}
        totalCount={100}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getByText("42 of 100 items")).toBeVisible();
    expect(screen.getByRole("button", { name: "First page" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("uses the shared pagination surface", () => {
    renderWithProviders(
      <PaginationControls
        page={2}
        pageCount={4}
        pageSize={100}
        filteredCount={80}
        totalCount={80}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveClass(
      "rl-pagination",
    );
    expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveClass(
      "border-0",
      "bg-transparent",
      "shadow-none",
    );
    expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveClass(
      "px-0",
      "py-1",
    );
    expect(screen.getByRole("combobox", { name: "Page size" })).toHaveClass(
      "w-24",
      "justify-center",
      "text-center",
    );
  });
});
