import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

    expect(screen.getByRole("form", { name: "Trace form" })).toHaveClass("rl-admin-form");
    expect(screen.getByLabelText("Virtual Host")).toBeVisible();
    expect(screen.getByLabelText("Name")).toBeVisible();
    expect(screen.getByLabelText("Format")).toBeVisible();
    expect(screen.getByLabelText("Pattern")).toBeVisible();
    expect(screen.getByLabelText("Maximum payload bytes")).toBeVisible();
    expect(screen.getByLabelText("Tracer username")).toBeVisible();
    expect(screen.getByLabelText("Tracer password")).toHaveAttribute("type", "password");
  });

  it("submits optional payload and credential settings as a tracing API body", async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <TraceForm
        vhosts={[{ name: "/" }]}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isPending={false}
      />,
    );

    await userEvent.type(screen.getByLabelText("Name"), "audit");
    await userEvent.clear(screen.getByLabelText("Maximum payload bytes"));
    await userEvent.type(screen.getByLabelText("Maximum payload bytes"), "4096");
    await userEvent.type(screen.getByLabelText("Tracer username"), "tracer");
    await userEvent.type(screen.getByLabelText("Tracer password"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Add a new trace" }));

    expect(onSubmit).toHaveBeenCalledWith({
      vhost: "/",
      name: "audit",
      body: {
        format: "text",
        pattern: "#",
        max_payload_bytes: 4096,
        tracer_connection_username: "tracer",
        tracer_connection_password: "secret",
      },
    });
  });

  it("rejects a non-numeric payload limit", async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <TraceForm
        vhosts={[{ name: "/" }]}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isPending={false}
      />,
    );

    await userEvent.type(screen.getByLabelText("Name"), "audit");
    await userEvent.type(screen.getByLabelText("Maximum payload bytes"), "kb");
    await userEvent.click(screen.getByRole("button", { name: "Add a new trace" }));

    expect(
      await screen.findByText("Enter a non-negative whole number or leave it blank."),
    ).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
