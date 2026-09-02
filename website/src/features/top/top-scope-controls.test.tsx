import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { NodeResponse } from "@/api/nodes-schema";
import { renderWithProviders } from "@/test/render";
import { TopScopeControls } from "./top-scope-controls";

describe("TopScopeControls", () => {
  it("uses the selected RabbitMQ node and a supported row-count scope", async () => {
    const onNodeChange = vi.fn();
    const onRowCountChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <TopScopeControls
        nodes={[{ name: "rabbit@one" }, { name: "rabbit@two" }] as NodeResponse[]}
        node="rabbit@one"
        rowCount={20}
        onNodeChange={onNodeChange}
        onRowCountChange={onRowCountChange}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Node" }));
    await user.click(screen.getByRole("option", { name: "rabbit@two" }));
    await user.click(screen.getByRole("combobox", { name: "Rows" }));
    await user.click(screen.getByRole("option", { name: "100" }));

    expect(onNodeChange).toHaveBeenCalledWith("rabbit@two");
    expect(onRowCountChange).toHaveBeenCalledWith(100);
  });
});
