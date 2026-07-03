import type { Exchange } from "@/domains/exchanges/exchange-schema";

export type ExchangeViewModel = {
  name: string;
  vhost: string;
  type: string;
  durable: boolean;
  autoDelete: boolean;
  internal: boolean;
  publishInRate: number | null;
  publishOutRate: number | null;
  features: string[];
};

export function createExchangeViewModel(raw: Exchange): ExchangeViewModel {
  const features: string[] = [];
  if (raw.durable) features.push("D");
  if (raw.auto_delete) features.push("AD");
  if (raw.internal) features.push("I");

  // The default exchange in RabbitMQ has no name (empty string)
  const displayName = raw.name === "" ? "(AMQP default)" : raw.name;

  return {
    name: displayName,
    vhost: raw.vhost ?? "/",
    type: raw.type ?? "direct",
    durable: raw.durable ?? false,
    autoDelete: raw.auto_delete ?? false,
    internal: raw.internal ?? false,
    publishInRate: raw.message_stats?.publish_in_details?.rate ?? null,
    publishOutRate: raw.message_stats?.publish_out_details?.rate ?? null,
    features,
  };
}
