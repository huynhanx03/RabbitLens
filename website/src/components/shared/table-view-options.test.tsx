import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { TableViewOptions } from "./table-view-options";

describe("TableViewOptions", () => {
  it("exposes column visibility without a density control", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <TableViewOptions
        columns={[
          { id: "name", label: "Name" },
          { id: "state", label: "State" },
        ]}
        visible={["name", "state"]}
        onVisibleChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Toggle columns" }));
    await user.click(screen.getByRole("checkbox", { name: "State" }));
    expect(onChange).toHaveBeenCalledWith(["name"]);
    expect(
      screen.queryByRole("button", { name: "Density" }),
    ).not.toBeInTheDocument();
  });
});
