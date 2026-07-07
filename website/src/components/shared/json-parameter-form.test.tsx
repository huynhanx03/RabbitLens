import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { JsonParameterForm } from "./json-parameter-form";

describe("JsonParameterForm", () => {
  it("uses the shared admin form surface for JSON parameters", () => {
    renderWithProviders(
      <JsonParameterForm
        vhosts={["/"]}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("form", { name: "JSON parameter form" })).toHaveClass(
      "rl-admin-form",
    );
    expect(screen.getByLabelText("Value (JSON)")).toHaveClass("rl-input");
  });
});
