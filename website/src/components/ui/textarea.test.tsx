import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("uses the shared RabbitLens input surface", () => {
    render(<Textarea aria-label="JSON" />);

    expect(screen.getByRole("textbox", { name: "JSON" })).toHaveClass(
      "rl-input",
    );
  });
});
