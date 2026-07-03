import type { Channel } from "./channel-schema";

export type ChannelViewModel = {
  name: string;
  node: string;
  user: string;
  vhost: string;
  number: number;
  state: string;
  idleSince: Date | null;
  transactional: boolean;
  confirm: boolean;
  consumerCount: number;
  unacknowledged: number;
  unconfirmed: number;
  uncommitted: number;
  prefetchCount: number;
  globalPrefetchCount: number;
  publishRate: number | null;
  deliverRate: number | null;
  ackRate: number | null;
  redeliverRate: number | null;
};

export function createChannelViewModel(raw: Channel): ChannelViewModel {
  return {
    name: raw.name,
    node: raw.node ?? "",
    user: raw.user ?? "",
    vhost: raw.vhost ?? "/",
    number: raw.number ?? 0,
    state: raw.state ?? "unknown",
    idleSince: raw.idle_since ? new Date(raw.idle_since) : null,
    transactional: raw.transactional ?? false,
    confirm: raw.confirm ?? false,
    consumerCount: raw.consumer_count ?? 0,
    unacknowledged: raw.messages_unacknowledged ?? 0,
    unconfirmed: raw.messages_unconfirmed ?? 0,
    uncommitted: raw.messages_uncommitted ?? 0,
    prefetchCount: raw.prefetch_count ?? 0,
    globalPrefetchCount: raw.global_prefetch_count ?? 0,
    publishRate: raw.message_stats?.publish_details?.rate ?? null,
    deliverRate: raw.message_stats?.deliver_get_details?.rate ?? null,
    ackRate: raw.message_stats?.ack_details?.rate ?? null,
    redeliverRate: raw.message_stats?.redeliver_details?.rate ?? null,
  };
}
