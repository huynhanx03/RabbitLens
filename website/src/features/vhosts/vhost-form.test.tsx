import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { VhostForm } from "./vhost-form";

describe("VhostForm", () => {
  it("normalizes comma-separated tags before submitting", async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<VhostForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Name"), "orders");
    await userEvent.type(screen.getByLabelText("Description"), "Order processing");
    await userEvent.type(screen.getByLabelText("Tags"), " production, eu-west , ,critical ");
    await userEvent.click(screen.getByRole("checkbox", { name: "Enable tracing" }));
    await userEvent.click(screen.getByRole("button", { name: "Add Virtual Host" }));

    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      name: "orders",
      description: "Order processing",
      tags: ["production", "eu-west", "critical"],
      default_queue_type: "classic",
      tracing: true,
    });
  });

  it("disables the immutable name field during an update", () => {
    renderWithProviders(
      <VhostForm initialValues={{ name: "orders" }} isUpdate onSubmit={vi.fn()} />,
    );

    expect(screen.getByLabelText("Name")).toBeDisabled();
  });
});
