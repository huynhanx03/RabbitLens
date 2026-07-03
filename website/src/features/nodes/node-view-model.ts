import type { NodeResponse } from "@/api/nodes-schema";

export type NodeStatus = "stopped" | "partitioned" | "alarm" | "healthy";

type Utilization = {
  used: number | null;
  limit: number | null;
  percent: number | null;
};

export type NodeViewModel = NodeResponse & {
  status: NodeStatus;
  memory: Utilization;
  disk: Utilization;
  processes: Utilization;
};

function createUtilization(
  used: number | undefined,
  limit: number | undefined,
): Utilization {
  const rawUsed = used ?? null;
  const rawLimit = limit ?? null;

  return {
    used: rawUsed,
    limit: rawLimit,
    percent:
      rawUsed !== null && rawLimit !== null && rawLimit > 0
        ? Math.min(100, Math.max(0, (rawUsed / rawLimit) * 100))
        : null,
  };
}

function resolveStatus(node: NodeResponse): NodeStatus {
  if (node.running !== true) {
    return "stopped";
  }
  if ((node.partitions?.length ?? 0) > 0) {
    return "partitioned";
  }
  if (node.mem_alarm === true || node.disk_free_alarm === true) {
    return "alarm";
  }
  return "healthy";
}

export function createNodeViewModel(node: NodeResponse): NodeViewModel {
  return {
    ...node,
    status: resolveStatus(node),
    memory: createUtilization(node.mem_used, node.mem_limit),
    disk: createUtilization(node.disk_free, node.disk_free_limit),
    processes: createUtilization(node.proc_used, node.proc_total),
  };
}
