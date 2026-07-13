import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { mockQueue } from "@/test/fixtures/queues";
import { renderWithProviders } from "@/test/render";
import { QueueAdvancedSection } from "./queue-advanced-section";

vi.mock("./message-inspector", () => ({
  MessageInspector: () => (
    <div role="region" aria-label="Message inspector">
      Message inspector content
    </div>
  ),
}));

describe("QueueAdvancedSection", () => {
  it("mounts diagnostics only after their disclosure opens", async () => {
    renderWithProviders(
      <QueueAdvancedSection
        queue={{
          ...mockQueue,
          policy: "queue-policy",
          operator_policy: "guardrail",
          effective_policy_definition: { "max-length": 1000 },
          leader: "rabbit@one",
          members: ["rabbit@one", "rabbit@two", "rabbit@three"],
          online: ["rabbit@one", "rabbit@two"],
        }}
        vhost="/"
        name="my-queue"
        tracingAvailable={false}
        onOpenTracing={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("region", { name: "Message inspector" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("queue-policy")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Message diagnostics" }),
    );
    expect(
      screen.getByRole("region", { name: "Message inspector" }),
    ).toBeVisible();

    await userEvent.click(
      screen.getByRole("button", { name: "Policies and replication" }),
    );
    expect(screen.getByText("queue-policy")).toBeVisible();
    expect(screen.getByText("guardrail")).toBeVisible();
    expect(screen.getByText(/max-length:/)).toBeVisible();
    expect(screen.getByText("Majority available")).toBeVisible();
  });
});
