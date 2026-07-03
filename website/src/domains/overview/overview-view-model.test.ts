import { describe, expect, it } from "vitest";
import { createOverviewViewModel } from "./overview-view-model";

const baseOverview = {
  rabbitmq_version: "4.4.0",
  erlang_version: "28.0",
  management_version: "4.4.0",
  cluster_name: "rabbit@cluster",
  disable_stats: false,
};

describe("createOverviewViewModel", () => {
  it("maps object, queue, and node totals without losing zero values", () => {
    const viewModel = createOverviewViewModel(
      {
        ...baseOverview,
        object_totals: {
          connections: 0,
          channels: 2,
          exchanges: 3,
          queues: 4,
          consumers: 5,
        },
        queue_totals: {
          messages_ready: 0,
          messages_unacknowledged: 7,
          messages: 7,
        },
      },
      [
        { name: "rabbit@one", running: true },
        { name: "rabbit@two", running: false },
      ],
    );

    expect(viewModel).toMatchObject({
      clusterName: "rabbit@cluster",
      statisticsDisabled: false,
      totals: {
        nodes: 2,
        connections: 0,
        channels: 2,
        exchanges: 3,
        queues: 4,
        consumers: 5,
        messagesReady: 0,
        messagesUnacked: 7,
        messagesTotal: 7,
      },
      nodeHealth: { running: 1, stopped: 1, alarmed: 0 },
    });
  });

  it("uses null for statistics that RabbitMQ omits", () => {
    const viewModel = createOverviewViewModel(
      { ...baseOverview, disable_stats: true },
      [{ name: "rabbit@one", running: true, mem_alarm: true }],
    );

    expect(viewModel.statisticsDisabled).toBe(true);
    expect(viewModel.totals.connections).toBeNull();
    expect(viewModel.totals.messagesTotal).toBeNull();
    expect(viewModel.nodeHealth.alarmed).toBe(1);
  });
});
