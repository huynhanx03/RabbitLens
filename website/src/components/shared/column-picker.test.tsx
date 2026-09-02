import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ColumnPicker } from "./column-picker";

describe("ColumnPicker", () => {
  it("adds and removes visible columns through the compact picker", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = renderWithProviders(
      <ColumnPicker
        columns={[
          { id: "name", label: "Name" },
          { id: "state", label: "State" },
        ]}
        onChange={onChange}
        visible={["name"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Toggle columns" }));
    await user.click(screen.getByRole("checkbox", { name: "State" }));
    expect(onChange).toHaveBeenCalledWith(["name", "state"]);

    rerender(
      <ColumnPicker
        columns={[
          { id: "name", label: "Name" },
          { id: "state", label: "State" },
        ]}
        onChange={onChange}
        visible={["name", "state"]}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: "Name" }));
    expect(onChange).toHaveBeenLastCalledWith(["state"]);
  });

  it("does not let an operator hide the final visible column", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <ColumnPicker
        columns={[{ id: "name", label: "Name" }]}
        onChange={onChange}
        visible={["name"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Toggle columns" }));
    await user.click(screen.getByRole("checkbox", { name: "Name" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
