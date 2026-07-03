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
});
