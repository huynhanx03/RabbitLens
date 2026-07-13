import type { ComponentType } from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Queue } from "@/domains/queues/queue-schema";
import { renderWithProviders } from "@/test/render";
import { mockQueue } from "@/test/fixtures/queues";

type QueueConfigurationComponent = ComponentType<{ queue: Queue }>;

async function loadComponent(): Promise<QueueConfigurationComponent | null> {
  const modulePath = "./queue-configuration-section";
  try {
    const module = (await import(/* @vite-ignore */ modulePath)) as {
      QueueConfigurationSection?: QueueConfigurationComponent;
    };
    return module.QueueConfigurationSection ?? null;
  } catch {
    return null;
  }
}

describe("QueueConfigurationSection", () => {
  it("renders true, false, and explicit empty arguments", async () => {
    const QueueConfigurationSection = await loadComponent();
    expect(QueueConfigurationSection).not.toBeNull();
    if (!QueueConfigurationSection) return;

    renderWithProviders(
      <QueueConfigurationSection
        queue={{
          ...mockQueue,
          durable: true,
          auto_delete: false,
          exclusive: false,
          arguments: {},
        }}
      />,
    );

    expect(screen.getByRole("region", { name: "Configuration" })).toBeVisible();
    expect(screen.getByText("Queue declaration")).toBeVisible();
    expect(screen.getAllByText("Yes")).toHaveLength(1);
    expect(screen.getAllByText("No")).toHaveLength(2);
    expect(screen.getByText("{}")).toBeVisible();
  });

  it("distinguishes unavailable values from false", async () => {
    const QueueConfigurationSection = await loadComponent();
    expect(QueueConfigurationSection).not.toBeNull();
    if (!QueueConfigurationSection) return;

    renderWithProviders(
      <QueueConfigurationSection
        queue={{
          name: "partial",
          arguments: { "x-queue-type": "quorum" },
        }}
      />,
    );

    expect(screen.getAllByText("Unavailable").length).toBeGreaterThan(0);
    expect(screen.getByText(/x-queue-type:/)).toBeVisible();
    expect(screen.getByText("quorum")).toBeVisible();
    expect(screen.queryByText("No")).not.toBeInTheDocument();
  });
});
