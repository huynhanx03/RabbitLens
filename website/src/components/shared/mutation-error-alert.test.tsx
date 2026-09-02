import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApiError } from "@/api/api-error";
import { MutationErrorAlert } from "./mutation-error-alert";

describe("MutationErrorAlert", () => {
  it("renders nothing when an operator action has no mutation error", () => {
    const { container } = render(<MutationErrorAlert error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("distinguishes validation errors from other RabbitMQ API errors", () => {
    const { rerender } = render(
      <MutationErrorAlert
        error={new ApiError("validation", 400, false, "Queue arguments are invalid")}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Validation Error");
    expect(screen.getByRole("alert")).toHaveTextContent("Queue arguments are invalid");

    rerender(
      <MutationErrorAlert
        error={new ApiError("server", 500, true, "Management API unavailable")}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("API Error");
    expect(screen.getByRole("alert")).toHaveTextContent("Management API unavailable");
  });

  it("keeps ordinary client errors actionable without exposing implementation details", () => {
    render(<MutationErrorAlert error={new Error("Network disconnected")} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Error");
    expect(screen.getByRole("alert")).toHaveTextContent("Network disconnected");
  });
});
