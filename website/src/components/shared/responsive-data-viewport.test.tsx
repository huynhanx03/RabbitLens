import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResponsiveDataViewport } from "./responsive-data-viewport";

describe("ResponsiveDataViewport", () => {
  it("preserves table content while providing a bounded horizontal-scroll boundary", () => {
    const { container } = render(
      <ResponsiveDataViewport className="queue-table-shell">
        <table aria-label="Queues">
          <tbody>
            <tr>
              <td>orders</td>
            </tr>
          </tbody>
        </table>
      </ResponsiveDataViewport>,
    );

    expect(screen.getByRole("table", { name: "Queues" })).toBeVisible();
    const outer = container.firstElementChild;
    expect(outer).toHaveClass("w-full", "overflow-x-auto", "queue-table-shell");
    expect(outer?.firstElementChild).toHaveClass("min-w-full");
  });
});
