import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { JsonParameterForm } from "./json-parameter-form";

describe("JsonParameterForm", () => {
  it("submits a validated parameter object", async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <JsonParameterForm
        vhosts={["/"]}
        initialValue={{ uri: "amqp://remote" }}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.type(screen.getByLabelText("Name"), "remote");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith({
      vhost: "/",
      name: "remote",
      value: { uri: "amqp://remote" },
    });
  });
});
