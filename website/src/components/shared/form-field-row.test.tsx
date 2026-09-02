import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormFieldRow } from "./form-field-row";

describe("FormFieldRow", () => {
  it("connects the accessible label to its input and renders validation feedback", () => {
    const { container } = render(
      <FormFieldRow
        className="queue-field"
        controlClassName="queue-control"
        error="Queue name is required"
        htmlFor="queue-name"
        label="Queue name"
        labelClassName="queue-label"
      >
        <input id="queue-name" />
      </FormFieldRow>,
    );

    expect(screen.getByLabelText("Queue name")).toBeVisible();
    expect(screen.getByText("Queue name is required")).toHaveClass("text-destructive");
    expect(container.firstElementChild).toHaveClass("queue-field");
    expect(screen.getByText("Queue name")).toHaveClass("queue-label");
    expect(screen.getByText("Queue name").nextElementSibling).toHaveClass("queue-control");
  });

  it("does not reserve an error region when a field is valid", () => {
    render(
      <FormFieldRow label="Routing key">
        <input />
      </FormFieldRow>,
    );

    expect(screen.queryByText("Queue name is required")).not.toBeInTheDocument();
  });
});
