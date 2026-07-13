import { describe, expect, it } from "vitest";

import type { Binding } from "@/domains/bindings/binding-schema";
import type { Exchange } from "@/domains/exchanges/exchange-schema";
import type { Queue } from "@/domains/queues/queue-schema";
import { mockQueue } from "@/test/fixtures/queues";

type ExchangeLookupState =
  | { status: "loading"; exchange: null }
  | { status: "available"; exchange: Exchange }
  | { status: "unavailable"; exchange: null };

type QueueTopologyRoute = {
  binding: Binding;
  exchange: Exchange | null;
  exchangeStatus: ExchangeLookupState["status"];
  isImplicitDefault: boolean;
};

type TopologyModule = {
  resolveExchangeLookupState?: (
    exchange: Exchange | undefined,
    isError: boolean,
  ) => ExchangeLookupState;
  createQueueTopologyConfig?: (
    queue: Queue,
    bindings: Binding[],
    exchangeLookups: Record<string, ExchangeLookupState>,
  ) => {
    queue: Queue;
    explicitRoutes: QueueTopologyRoute[];
    systemRoutes: QueueTopologyRoute[];
  };
  listExplicitSourceExchanges?: (bindings: Binding[]) => string[];
};

const bindings: Binding[] = [
  {
    source: "",
    vhost: "/",
    destination: "my-queue",
    destination_type: "queue",
    routing_key: "my-queue",
    arguments: {},
    properties_key: "my-queue",
  },
  {
    source: "events",
    vhost: "/",
    destination: "my-queue",
    destination_type: "queue",
    routing_key: "scan.#",
    arguments: { "x-match": "all" },
    properties_key: "scan.%23",
  },
  {
    source: "events",
    vhost: "/",
    destination: "my-queue",
    destination_type: "queue",
    routing_key: "",
    arguments: {},
    properties_key: "~",
  },
  {
    source: "audit",
    vhost: "/",
    destination: "my-queue",
    destination_type: "queue",
    routing_key: "activity.#",
    arguments: {},
    properties_key: "activity.%23",
  },
];

const eventsExchange: Exchange = {
  name: "events",
  vhost: "/",
  type: "topic",
  durable: true,
  auto_delete: false,
  internal: false,
  arguments: {},
};

async function loadTopologyModule(): Promise<TopologyModule | null> {
  const modulePath = "./queue-topology-view-model";
  try {
    return (await import(/* @vite-ignore */ modulePath)) as TopologyModule;
  } catch {
    return null;
  }
}

describe("queue topology view model", () => {
  it("classifies system bindings and preserves every explicit route", async () => {
    const topologyModule = await loadTopologyModule();
    expect(topologyModule).not.toBeNull();
    const createQueueTopologyConfig =
      topologyModule?.createQueueTopologyConfig;
    expect(createQueueTopologyConfig).toBeTypeOf("function");
    if (!createQueueTopologyConfig) return;

    const result = createQueueTopologyConfig(mockQueue, bindings, {
      events: { status: "available", exchange: eventsExchange },
      audit: { status: "unavailable", exchange: null },
    });

    expect(result.systemRoutes).toHaveLength(1);
    expect(result.systemRoutes[0].isImplicitDefault).toBe(true);
    expect(result.explicitRoutes).toHaveLength(3);
    expect(result.explicitRoutes[0]).toMatchObject({
      binding: { source: "events", routing_key: "scan.#" },
      exchange: eventsExchange,
      exchangeStatus: "available",
    });
    expect(result.explicitRoutes[1].binding.routing_key).toBe("");
    expect(result.explicitRoutes[2].exchangeStatus).toBe("unavailable");
  });

  it("returns unique non-empty source exchanges in binding order", async () => {
    const topologyModule = await loadTopologyModule();
    expect(topologyModule).not.toBeNull();
    const listExplicitSourceExchanges =
      topologyModule?.listExplicitSourceExchanges;
    expect(listExplicitSourceExchanges).toBeTypeOf("function");
    if (!listExplicitSourceExchanges) return;

    expect(listExplicitSourceExchanges(bindings)).toEqual(["events", "audit"]);
  });

  it("marks unresolved exchange details as loading", async () => {
    const topologyModule = await loadTopologyModule();
    expect(topologyModule).not.toBeNull();
    const createQueueTopologyConfig =
      topologyModule?.createQueueTopologyConfig;
    expect(createQueueTopologyConfig).toBeTypeOf("function");
    if (!createQueueTopologyConfig) return;

    const result = createQueueTopologyConfig(mockQueue, bindings, {});
    expect(result.explicitRoutes[0].exchangeStatus).toBe("loading");
  });

  it("does not present stale exchange data as available after a failed refetch", async () => {
    const topologyModule = await loadTopologyModule();
    const resolveExchangeLookupState =
      topologyModule?.resolveExchangeLookupState;
    expect(resolveExchangeLookupState).toBeTypeOf("function");
    if (!resolveExchangeLookupState) return;

    expect(resolveExchangeLookupState(eventsExchange, true)).toEqual({
      status: "unavailable",
      exchange: null,
    });
  });
});
