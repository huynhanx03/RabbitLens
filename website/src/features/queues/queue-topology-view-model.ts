import type { Binding } from "@/domains/bindings/binding-schema";
import type { Exchange } from "@/domains/exchanges/exchange-schema";
import type { Queue } from "@/domains/queues/queue-schema";

export type ExchangeLookupState =
  | { status: "loading"; exchange: null }
  | { status: "available"; exchange: Exchange }
  | { status: "unavailable"; exchange: null };

export type QueueTopologyRoute = {
  binding: Binding;
  exchange: Exchange | null;
  exchangeStatus: ExchangeLookupState["status"];
  isImplicitDefault: boolean;
};

export type QueueTopologyConfig = {
  queue: Queue;
  explicitRoutes: QueueTopologyRoute[];
  systemRoutes: QueueTopologyRoute[];
};

export function resolveExchangeLookupState(
  exchange: Exchange | undefined,
  isError: boolean,
): ExchangeLookupState {
  if (isError) {
    return { status: "unavailable", exchange: null };
  }
  if (exchange) {
    return { status: "available", exchange };
  }
  return { status: "loading", exchange: null };
}

export function listExplicitSourceExchanges(bindings: Binding[]): string[] {
  return Array.from(
    new Set(
      bindings
        .map((binding) => binding.source)
        .filter((source): source is string => source.length > 0),
    ),
  );
}

export function createQueueTopologyConfig(
  queue: Queue,
  bindings: Binding[],
  exchangeLookups: Record<string, ExchangeLookupState>,
): QueueTopologyConfig {
  const routes = bindings.map<QueueTopologyRoute>((binding) => {
    if (binding.source === "") {
      return {
        binding,
        exchange: null,
        exchangeStatus: "available",
        isImplicitDefault: true,
      };
    }

    const lookup = exchangeLookups[binding.source] ?? {
      status: "loading" as const,
      exchange: null,
    };

    return {
      binding,
      exchange: lookup.exchange,
      exchangeStatus: lookup.status,
      isImplicitDefault: false,
    };
  });

  return {
    queue,
    explicitRoutes: routes.filter((route) => !route.isImplicitDefault),
    systemRoutes: routes.filter((route) => route.isImplicitDefault),
  };
}
