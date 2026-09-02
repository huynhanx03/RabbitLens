import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ArgumentsEditor } from "./arguments-editor";

describe("ArgumentsEditor", () => {
  it("uses labelled controls and submits a typed numeric argument", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ArgumentsEditor value={{}} onChange={onChange} />);

    await user.type(screen.getByLabelText("Key"), "x-message-ttl");
    await user.click(screen.getByRole("combobox", { name: "Type" }));
    await user.click(screen.getByRole("option", { name: "Type Number" }));
    await user.type(screen.getByLabelText("Value"), "60000");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onChange).toHaveBeenCalledWith({ "x-message-ttl": 60000 });
  });

  it("serializes boolean values and removes an existing argument", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ArgumentsEditor value={{ durable: true }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onChange).toHaveBeenCalledWith({});

    await user.type(screen.getByLabelText("Key"), "x-single-active-consumer");
    await user.click(screen.getByRole("combobox", { name: "Type" }));
    await user.click(screen.getByRole("option", { name: "Type Boolean" }));
    await user.click(screen.getByRole("combobox", { name: "Value" }));
    await user.click(screen.getByRole("option", { name: "true" }));
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onChange).toHaveBeenLastCalledWith({
      durable: true,
      "x-single-active-consumer": true,
    });
  });

  it("does not expose editable controls when disabled", () => {
    renderWithProviders(<ArgumentsEditor value={{}} onChange={vi.fn()} disabled />);

    expect(screen.getByLabelText("Key")).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Type" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });
});
