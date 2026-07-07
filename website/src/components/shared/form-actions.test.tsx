import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { FormActions } from "./form-actions";

describe("FormActions", () => {
  it("locks both actions while a form is pending", async () => {
    const onCancel = vi.fn();
    renderWithProviders(
      <FormActions
        isPending
        onCancel={onCancel}
        submitLabel="Save"
        pendingLabel="Saving"
      />,
    );

    expect(screen.getByTestId("form-actions")).toHaveClass("rl-form-actions");
    expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).not.toHaveBeenCalled();
  });
});
