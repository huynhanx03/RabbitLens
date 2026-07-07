import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { UserForm } from "./user-form";

describe("UserForm", () => {
  it("uses localized admin form controls", () => {
    renderWithProviders(<UserForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole("form", { name: "User form" })).toHaveClass(
      "rl-admin-form",
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(
      screen.getByText("Supported tags:", { exact: false }),
    ).toBeVisible();
  });
});
