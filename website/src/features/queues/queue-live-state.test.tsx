import type { ComponentType } from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Queue } from "@/domains/queues/queue-schema";
import { mockQueue } from "@/test/fixtures/queues";
import { renderWithProviders } from "@/test/render";

type QueueLiveStateComponent = ComponentType<{
  queue: Queue;
  canShowQueueTotals: boolean;
  availabilityReason?: string;
}>;

async function loadComponent(): Promise<QueueLiveStateComponent | null> {
  const modulePath = "./queue-live-state";
  try {
    const module = (await import(/* @vite-ignore */ modulePath)) as {
      QueueLiveState?: QueueLiveStateComponent;
    };
    return module.QueueLiveState ?? null;
  } catch {
    return null;
  }
}

describe("QueueLiveState", () => {
  it("renders current backlog, consumers, and capacity", async () => {
    const QueueLiveState = await loadComponent();
    expect(QueueLiveState).not.toBeNull();
    if (!QueueLiveState) return;

    renderWithProviders(
      <QueueLiveState
        queue={{ ...mockQueue, consumer_capacity: 0.94 }}
        canShowQueueTotals
      />,
    );

    expect(screen.getByRole("region", { name: "Ready" })).toHaveTextContent("10");
    expect(screen.getByRole("region", { name: "Unacked" })).toHaveTextContent("5");
    expect(screen.getByRole("region", { name: "Total" })).toHaveTextContent("15");
    expect(screen.getByRole("region", { name: "Consumers" })).toHaveTextContent("2");
    expect(
      screen.getByRole("region", { name: "Consumer capacity" }),
    ).toHaveTextContent("94%");
  });

  it("promotes unavailable statistics and unhealthy replication", async () => {
    const QueueLiveState = await loadComponent();
    expect(QueueLiveState).not.toBeNull();
    if (!QueueLiveState) return;

    renderWithProviders(
      <QueueLiveState
        queue={{
          ...mockQueue,
          members: ["rabbit@one", "rabbit@two", "rabbit@three"],
          online: ["rabbit@one"],
        }}
        canShowQueueTotals={false}
        availabilityReason="Queue totals are disabled."
      />,
    );

    expect(screen.getByText("Statistics Unavailable")).toBeVisible();
    expect(screen.getByText("Replication majority unavailable")).toBeVisible();
    expect(screen.getByText("1 of 3 members are online. Queue availability is at risk.")).toBeVisible();
  });
});
