import { screen, waitFor } from "@testing-library/react";
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
      <PolicyForm
        apiClient={apiClient as never}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText("Virtual Host")).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Pattern")).toBeInTheDocument();
    expect(screen.getByLabelText("Apply to")).toBeInTheDocument();
    expect(screen.getByLabelText("Priority")).toBeInTheDocument();
    expect(screen.getByLabelText("Definition (JSON)")).toBeInTheDocument();
  });
});
