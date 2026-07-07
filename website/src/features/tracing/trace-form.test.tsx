import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { TraceForm } from "./trace-form";

describe("TraceForm", () => {
  it("labels operational and optional credential fields", () => {
    renderWithProviders(
      <TraceForm
        vhosts={[{ name: "/" }]}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.getByRole("form", { name: "Trace form" })).toHaveClass(
      "rl-admin-form",
    );
    expect(screen.getByLabelText("Virtual Host")).toBeVisible();
    expect(screen.getByLabelText("Name")).toBeVisible();
    expect(screen.getByLabelText("Format")).toBeVisible();
    expect(screen.getByLabelText("Pattern")).toBeVisible();
    expect(screen.getByLabelText("Maximum payload bytes")).toBeVisible();
    expect(screen.getByLabelText("Tracer username")).toBeVisible();
    expect(screen.getByLabelText("Tracer password")).toHaveAttribute("type", "password");
  });
});
