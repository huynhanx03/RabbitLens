import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { QueueReplicationState } from "./queue-replication-state";

describe("QueueReplicationState", () => {
  it("shows leader member availability and majority health", () => {
    renderWithProviders(
      <QueueReplicationState
        leader="rabbit@one"
        members={["rabbit@one", "rabbit@two", "rabbit@three"]}
        online={["rabbit@one", "rabbit@two"]}
      />,
    );

    expect(screen.getAllByText("rabbit@one")).toHaveLength(2);
    expect(screen.getAllByText("Online")).toHaveLength(2);
    expect(screen.getByText("Offline")).toBeVisible();
    expect(screen.getByText("Majority available")).toBeVisible();
  });
});
