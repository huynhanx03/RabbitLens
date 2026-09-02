import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AmqpValue } from "./amqp-value";

describe("AmqpValue", () => {
  it("preserves AMQP string values literally while React keeps them as text", () => {
    const value = '<message type="order">created</message>';
    const { container } = render(<AmqpValue value={value} />);

    expect(screen.getByText(value)).toBeVisible();
    expect(container.querySelector("message")).toBeNull();
  });

  it("renders scalar and nested table values without losing their shape", () => {
    render(
      <AmqpValue
        value={{
          durable: true,
          retry_count: 3,
          headers: ["x-region", { region: "ap-southeast-1" }],
          missing: null,
        }}
      />,
    );

    expect(screen.getByText("durable:")).toBeVisible();
    expect(screen.getByText("true")).toBeVisible();
    expect(screen.getByText("retry_count:")).toBeVisible();
    expect(screen.getByText("3")).toBeVisible();
    expect(screen.getByText("ap-southeast-1")).toBeVisible();
    expect(screen.getByText("null")).toBeVisible();
  });

  it("collapses deeply nested AMQP tables to keep detail pages readable", () => {
    const deeplyNested = { a: { b: { c: { d: { e: { f: { g: "value" } } } } } } };
    render(<AmqpValue value={deeplyNested} />);

    expect(screen.getByText("{1 keys}")).toBeVisible();
  });
});
