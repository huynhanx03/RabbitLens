import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("provides browser DOM assertions", () => {
    render(<main aria-label="RabbitLens" />);
    expect(screen.getByRole("main", { name: "RabbitLens" })).toBeInTheDocument();
  });
});
