import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { LimitForm } from "./limit-form";

describe("LimitForm", () => {
  it("submits an integer user limit with a known owner", async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <LimitForm
        scope="user"
        owners={["service-user"]}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("form", { name: "Limit form" })).toHaveClass(
      "rl-admin-form",
    );
    await userEvent.clear(screen.getByLabelText("Value"));
    await userEvent.type(screen.getByLabelText("Value"), "25");
    await userEvent.click(
      screen.getByRole("button", { name: "Set a limit" }),
    );

    expect(onSubmit).toHaveBeenCalledWith({
      scope: "user",
      owner: "service-user",
      name: "max-connections",
      value: 25,
    });
  });
});
