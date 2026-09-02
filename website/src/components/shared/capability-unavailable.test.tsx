import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CapabilityUnavailable } from "./capability-unavailable";

describe("CapabilityUnavailable", () => {
  it.each([
    [
      "not-installed",
      "This extension is not enabled on the RabbitMQ server.",
      "text-card-foreground",
    ],
    ["forbidden", "Your account cannot access this extension.", "text-card-foreground"],
    ["discovery-failed", "Failed to load extensions capability.", "text-destructive"],
  ] as const)("explains the %s extension state", (reason, description, variantClass) => {
    render(<CapabilityUnavailable reason={reason} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Extension unavailable");
    expect(screen.getByRole("alert")).toHaveTextContent(description);
    expect(screen.getByRole("alert")).toHaveClass(variantClass);
  });
});
