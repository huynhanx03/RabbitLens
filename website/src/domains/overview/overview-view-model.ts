import type { NodeResponse } from "@/api/nodes-schema";
import type { OverviewResponse } from "./overview-schema";
import { resolveStatisticsMode, getStatisticsSelectors, type StatisticsSelectors } from "@/api/statistics-capabilities";

export type OverviewViewModel = {
  clusterName: string;
  rabbitmqVersion: string;
  managementVersion: string;
  statisticsDisabled: boolean;
  statisticsCapabilities: StatisticsSelectors;
  totals: {
    nodes: number;
    connections: number | null;
    channels: number | null;
    exchanges: number | null;
    queues: number | null;
    consumers: number | null;
    messagesReady: number | null;
    messagesUnacked: number | null;
    messagesTotal: number | null;
  };
  nodeHealth: {
    running: number;
    stopped: number;
    alarmed: number;
  };
};

export function createOverviewViewModel(
  overview: OverviewResponse,
  nodes: readonly NodeResponse[],
): OverviewViewModel {
  const running = nodes.filter((node) => node.running === true).length;
  const alarmed = nodes.filter(
    (node) => node.mem_alarm === true || node.disk_free_alarm === true,
  ).length;

  const mode = resolveStatisticsMode(overview);
  const statisticsCapabilities = getStatisticsSelectors(mode);

  return {
    clusterName: overview.cluster_name,
    rabbitmqVersion: overview.rabbitmq_version,
    managementVersion: overview.management_version,
    statisticsDisabled: overview.disable_stats,
    statisticsCapabilities,
    totals: {
      nodes: nodes.length,
      connections: overview.object_totals?.connections ?? null,
      channels: overview.object_totals?.channels ?? null,
      exchanges: overview.object_totals?.exchanges ?? null,
      queues: overview.object_totals?.queues ?? null,
      consumers: overview.object_totals?.consumers ?? null,
      messagesReady: overview.queue_totals?.messages_ready ?? null,
      messagesUnacked:
        overview.queue_totals?.messages_unacknowledged ?? null,
      messagesTotal: overview.queue_totals?.messages ?? null,
    },
    nodeHealth: {
      running,
      stopped: nodes.length - running,
      alarmed,
    },
  };
}
