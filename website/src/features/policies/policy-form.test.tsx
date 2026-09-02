import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { PolicyForm } from "./policy-form";

describe("PolicyForm", () => {
  it("associates every policy field with an accessible label", async () => {
    const apiClient = {
      request: vi.fn().mockResolvedValue([{ name: "/" }]),
      requestVoid: vi.fn(),
    };
    renderWithProviders(
      <PolicyForm apiClient={apiClient as never} onSubmit={vi.fn()} onCancel={vi.fn()} />,
    );

    await waitFor(() => expect(screen.getByLabelText("Virtual Host")).toBeInTheDocument());
    expect(screen.getByRole("form", { name: "Policy form" })).toHaveClass("rl-admin-form");
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Pattern")).toBeInTheDocument();
    expect(screen.getByLabelText("Apply to")).toBeInTheDocument();
    expect(screen.getByLabelText("Priority")).toBeInTheDocument();
    expect(screen.getByLabelText("Definition (JSON)")).toBeInTheDocument();
  });

  it("submits a parsed policy definition for the selected vhost", async () => {
    const onSubmit = vi.fn();
    const apiClient = { request: vi.fn().mockResolvedValue([{ name: "/" }]), requestVoid: vi.fn() };
    renderWithProviders(
      <PolicyForm
        apiClient={apiClient as never}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        initialValues={{
          vhost: "/",
          name: "orders",
          pattern: "^orders\\.",
          "apply-to": "queues",
          priority: 3,
          definition: { "message-ttl": 60_000 },
        }}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add / update a policy" })).toBeEnabled(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Add / update a policy" }));

    expect(onSubmit).toHaveBeenCalledWith("/", "orders", {
      pattern: "^orders\\.",
      "apply-to": "queues",
      priority: 3,
      definition: { "message-ttl": 60_000 },
    });
  });

  it("does not submit an invalid policy definition", async () => {
    const onSubmit = vi.fn();
    const apiClient = { request: vi.fn().mockResolvedValue([{ name: "/" }]), requestVoid: vi.fn() };
    renderWithProviders(
      <PolicyForm
        apiClient={apiClient as never}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        initialValues={{ vhost: "/", name: "orders" }}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add / update a policy" })).toBeEnabled(),
    );
    const definition = screen.getByLabelText("Definition (JSON)");
    await userEvent.clear(definition);
    await userEvent.type(definition, "invalid");
    await userEvent.click(screen.getByRole("button", { name: "Add / update a policy" }));

    expect(
      await screen.findByText("Enter a valid JSON object with string, number, or boolean values."),
    ).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
