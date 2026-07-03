import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/api-error";
import { renderWithProviders } from "@/test/render";
import { ConfirmDialog } from "./confirm-dialog";

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  title: "Delete resource",
  description: "This cannot be undone.",
  onConfirm: vi.fn(),
};

describe("ConfirmDialog", () => {
  it("prevents duplicate actions while the mutation is pending", async () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <ConfirmDialog {...defaultProps} onConfirm={onConfirm} isConfirming />,
    );

    expect(screen.getByRole("button", { name: "Loading" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Loading" }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("keeps a mutation error in the confirmation context", () => {
    const error = new ApiError("server", 500, true, "RabbitMQ refused the request");
    renderWithProviders(<ConfirmDialog {...defaultProps} error={error} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "RabbitMQ refused the request",
    );
  });
});
