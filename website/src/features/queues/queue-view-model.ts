import type { Queue } from "@/domains/queues/queue-schema";

export type QueueViewModel = {
  name: string;
  vhost: string;
  type: string;
  node: string;
  state: string;
  features: string[];
  messagesReady: number;
  messagesUnacked: number;
  messagesTotal: number;
  messageBytes: number;
  consumers: number;
  publishRate: number | null;
  deliverRate: number | null;
  ackRate: number | null;
};

export function createQueueViewModel(raw: Queue): QueueViewModel {
  const features: string[] = [];
  if (raw.durable) features.push("D");
  if (raw.auto_delete) features.push("AD");
  if (raw.exclusive) features.push("Excl");

  return {
    name: raw.name,
    vhost: raw.vhost ?? "/",
    type: raw.type ?? "classic",
    node: raw.node ?? "",
    state: raw.state ?? "unknown",
    features,
    messagesReady: raw.messages_ready ?? 0,
    messagesUnacked: raw.messages_unacknowledged ?? 0,
    messagesTotal: raw.messages ?? 0,
    messageBytes: raw.message_bytes ?? 0,
    consumers: raw.consumers ?? 0,
    publishRate: raw.message_stats?.publish_details?.rate ?? null,
    deliverRate: raw.message_stats?.deliver_get_details?.rate ?? null,
    ackRate: raw.message_stats?.ack_details?.rate ?? null,
  };
}
