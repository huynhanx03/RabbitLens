# Queue Consumer Topology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Queue Detail into a topology-first consumer configuration page, remove Message rates history, retain Message counts history, and eliminate the duplicate cold-navigation queue request.

**Architecture:** A shared queue-detail query-options factory gives the route loader and page one cache identity. A pure topology mapper joins queue bindings to cached source-exchange declarations, while focused presentational components render Queue declaration, Consumer routes, Live state, and lazy Advanced diagnostics.

**Tech Stack:** React 19, TypeScript 6, TanStack Query 5, TanStack Router, i18next, Zod, Vitest, Testing Library, Playwright, ECharts.

## Global Constraints

- Display actual RabbitMQ topology only; never invent application aliases, publisher identity, or delivery_mode.
- Preserve all explicit bindings and valid empty routing keys.
- Treat the empty-source default-exchange binding as a collapsed broker-managed system binding.
- Render true, false, and unavailable as distinct localized states.
- Retain Message counts history and statistics-availability behavior.
- Remove Queue Detail Message rates history and msg_rates request parameters; Queue list rates remain unchanged.
- Readable topology remains visible when mutation permission is absent; Management API 401/403 errors stay in mutation dialogs.
- Do not add dependencies.
- Do not include the repository-wide optimization track in this implementation plan.

---

## File Structure

### Create

- website/src/domains/queues/queue-query.test.ts — queue-detail cache identity and count-only request contract.
- website/src/domains/bindings/binding-query.test.ts — queue-binding query-options contract.
- website/src/domains/exchanges/exchange-query.test.ts — statistics-free exchange configuration query contract.
- website/src/features/queues/queue-topology-view-model.ts — pure binding classification and exchange join.
- website/src/features/queues/queue-topology-view-model.test.ts — mapper edge cases.
- website/src/features/queues/queue-configuration-section.tsx — queue declaration presentation.
- website/src/features/queues/queue-configuration-section.test.tsx — boolean and argument rendering.
- website/src/features/queues/queue-consumer-routes.tsx — explicit/system route presentation and binding management.
- website/src/features/queues/queue-consumer-routes.test.tsx — route, empty key, partial exchange, and system disclosure behavior.
- website/src/features/queues/queue-live-state.tsx — current metrics and replication warning.
- website/src/features/queues/queue-live-state.test.tsx — statistics and replication states.
- website/src/features/queues/queue-advanced-section.tsx — lazy Message Inspector, policy, and replication disclosures.
- website/src/features/queues/queue-advanced-section.test.tsx — lazy accessible disclosure behavior.

### Modify

- website/src/config/chart-ranges.ts — make Queue Detail request lengths samples only.
- website/src/config/chart-ranges.test.ts — lock the count-only parameter contract.
- website/src/domains/queues/queue-query.ts — export queueDetailQueryOptions.
- website/src/domains/bindings/binding-query.ts — export queueBindingsQueryOptions.
- website/src/domains/exchanges/exchange-query.ts — export exchangeConfigQueryOptions.
- website/src/features/bindings/binding-list.tsx — consume the shared binding query options.
- website/src/app/routes/_authenticated/queues/$vhost.$name.tsx — await the shared queue query.
- website/src/features/queues/queue-detail-page.tsx — orchestrate the approved section order.
- website/src/features/queues/queue-detail-page.test.tsx — integration regression coverage.
- website/src/test/fixtures/queues.ts — representative declaration and count samples.
- website/src/i18n/locales/en.ts — English Queue topology labels.
- website/src/i18n/locales/vi.ts — Vietnamese Queue topology labels.
- website/tests/e2e/performance.spec.ts — one cold-navigation detail request assertion.

---

### Task 1: Count-only Queue Detail query and shared cache identity

**Files:**

- Modify: website/src/config/chart-ranges.ts
- Modify: website/src/config/chart-ranges.test.ts
- Modify: website/src/domains/queues/queue-query.ts
- Create: website/src/domains/queues/queue-query.test.ts
- Modify: website/src/app/routes/_authenticated/queues/$vhost.$name.tsx
- Modify: website/src/features/queues/queue-detail-page.tsx

**Interfaces:**

- Produces: queueDetailQueryOptions(apiClient, vhost, name, range)
- Produces: QUEUE_RANGE_PREFIXES equal to readonly ["lengths"]
- Consumed by: the Queue route loader and QueueDetailPage

- [ ] **Step 1: Change the range test and add the failing query-options test**

Replace the queue assertion in website/src/config/chart-ranges.test.ts with:

    it("builds queue range parameters with lengths only", () => {
      const params = buildRangeQueryParams(range60s, QUEUE_RANGE_PREFIXES);
      expect(params.get("lengths_age")).toBe("60");
      expect(params.get("lengths_incr")).toBe("5");
      expect(params.has("data_rates_age")).toBe(false);
      expect(params.has("msg_rates_age")).toBe(false);
    });

Create website/src/domains/queues/queue-query.test.ts:

    import { QueryClient } from "@tanstack/react-query";
    import { describe, expect, it, vi } from "vitest";
    import type { ManagementApiClient } from "@/api/management-api-client";
    import { CHART_RANGES } from "@/config/chart-ranges";
    import { PRODUCT_DEFAULTS } from "@/config/defaults";
    import { mockQueue } from "@/test/fixtures/queues";
    import { queueDetailQueryOptions } from "./queue-query";

    describe("queueDetailQueryOptions", () => {
      it("uses a stable range key and requests lengths without message rates", async () => {
        const request = vi.fn().mockResolvedValue(mockQueue);
        const apiClient = { request } as unknown as ManagementApiClient;
        const queryClient = new QueryClient({
          defaultOptions: { queries: { retry: false } },
        });

        const first = queueDetailQueryOptions(apiClient, "/", "orders", CHART_RANGES[0]);
        const second = queueDetailQueryOptions(apiClient, "/", "orders", CHART_RANGES[0]);

        expect(first.queryKey).toEqual(second.queryKey);
        expect(first.staleTime).toBe(PRODUCT_DEFAULTS.polling.nodeDetailsMs);
        await queryClient.fetchQuery(first);

        expect(request).toHaveBeenCalledWith(
          "/queues/%2F/orders?lengths_age=60&lengths_incr=5",
          expect.anything(),
          expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
      });
    });

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

    npm --prefix website test -- src/config/chart-ranges.test.ts src/domains/queues/queue-query.test.ts

Expected: FAIL because QUEUE_RANGE_PREFIXES still contains data_rates/msg_rates and queueDetailQueryOptions is not exported.

- [ ] **Step 3: Implement the count-only prefix and query-options factory**

Replace QUEUE_RANGE_PREFIXES in website/src/config/chart-ranges.ts with:

    export const QUEUE_RANGE_PREFIXES = ["lengths"] as const;

Add these imports to website/src/domains/queues/queue-query.ts:

    import { queryOptions } from "@tanstack/react-query";
    import { getQueue } from "./queue-api";
    import {
      buildRangeQueryParams,
      QUEUE_RANGE_PREFIXES,
      type ChartRange,
    } from "@/config/chart-ranges";
    import { PRODUCT_DEFAULTS } from "@/config/defaults";

Keep the existing mutation imports, removing getQueue from a duplicate import if one is created. Add this function after queueKeys:

    export function queueDetailQueryOptions(
      apiClient: ManagementApiClient,
      vhost: string,
      name: string,
      range: ChartRange,
    ) {
      return queryOptions({
        queryKey: [
          ...queueKeys.detail(vhost, name),
          "lengths",
          range.ageSeconds,
          range.incrementSeconds,
        ] as const,
        queryFn: ({ signal }) =>
          getQueue(
            apiClient,
            vhost,
            name,
            buildRangeQueryParams(range, QUEUE_RANGE_PREFIXES),
            signal,
          ),
        staleTime: PRODUCT_DEFAULTS.polling.nodeDetailsMs,
      });
    }

- [ ] **Step 4: Make loader and page consume the exact same options**

Replace the loader body in website/src/app/routes/_authenticated/queues/$vhost.$name.tsx with:

    loader: ({ context, params }) =>
      context.queryClient.ensureQueryData(
        queueDetailQueryOptions(
          context.apiClient,
          params.vhost,
          params.name,
          CHART_RANGES[0],
        ),
      ),

Replace the route file imports with:

    import { createFileRoute } from "@tanstack/react-router";
    import { QueueDetailPage } from "@/features/queues/queue-detail-page";
    import { queueDetailQueryOptions } from "@/domains/queues/queue-query";
    import { CHART_RANGES } from "@/config/chart-ranges";

In website/src/features/queues/queue-detail-page.tsx, replace the existing Queue useQuery block with:

    const { data: queue } = useQuery({
      ...queueDetailQueryOptions(context.apiClient, vhost, name, range),
      refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.nodeDetailsMs),
    });

Import queueDetailQueryOptions from queue-query and remove getQueue, buildRangeQueryParams, QUEUE_RANGE_PREFIXES, and queueKeys imports that become unused.

- [ ] **Step 5: Run focused verification and verify GREEN**

Run:

    npm --prefix website test -- src/config/chart-ranges.test.ts src/domains/queues/queue-query.test.ts src/features/queues/queue-detail-page.test.tsx
    npm --prefix website run typecheck

Expected: all selected tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit Task 1**

    git add website/src/config/chart-ranges.ts website/src/config/chart-ranges.test.ts website/src/domains/queues/queue-query.ts website/src/domains/queues/queue-query.test.ts 'website/src/app/routes/_authenticated/queues/$vhost.$name.tsx' website/src/features/queues/queue-detail-page.tsx
    git commit -m "perf: deduplicate queue detail requests"

---

### Task 2: Pure Queue topology model

**Files:**

- Create: website/src/features/queues/queue-topology-view-model.ts
- Create: website/src/features/queues/queue-topology-view-model.test.ts

**Interfaces:**

- Produces: ExchangeLookupState
- Produces: QueueTopologyRoute
- Produces: QueueTopologyConfig
- Produces: listExplicitSourceExchanges(bindings)
- Produces: createQueueTopologyConfig(queue, bindings, exchangeLookups)
- Consumed by: QueueDetailPage and QueueConsumerRoutes

- [ ] **Step 1: Write the failing mapper tests**

Create website/src/features/queues/queue-topology-view-model.test.ts:

    import { describe, expect, it } from "vitest";
    import type { Binding } from "@/domains/bindings/binding-schema";
    import type { Exchange } from "@/domains/exchanges/exchange-schema";
    import { mockQueue } from "@/test/fixtures/queues";
    import {
      createQueueTopologyConfig,
      listExplicitSourceExchanges,
      type ExchangeLookupState,
    } from "./queue-topology-view-model";

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

    const events: Exchange = {
      name: "events",
      vhost: "/",
      type: "topic",
      durable: true,
      auto_delete: false,
      internal: false,
      arguments: {},
    };

    it("classifies system bindings and preserves every explicit route", () => {
      const lookups: Record<string, ExchangeLookupState> = {
        events: { status: "available", exchange: events },
        audit: { status: "unavailable", exchange: null },
      };

      const result = createQueueTopologyConfig(mockQueue, bindings, lookups);

      expect(result.systemRoutes).toHaveLength(1);
      expect(result.explicitRoutes).toHaveLength(3);
      expect(result.explicitRoutes[0]).toMatchObject({
        binding: { source: "events", routing_key: "scan.#" },
        exchange: events,
        exchangeStatus: "available",
      });
      expect(result.explicitRoutes[1].binding.routing_key).toBe("");
      expect(result.explicitRoutes[2].exchangeStatus).toBe("unavailable");
    });

    it("returns unique non-empty source exchange names in binding order", () => {
      expect(listExplicitSourceExchanges(bindings)).toEqual(["events", "audit"]);
    });

    it("marks an exchange lookup as loading until a query resolves", () => {
      const result = createQueueTopologyConfig(mockQueue, bindings, {});
      expect(result.explicitRoutes[0].exchangeStatus).toBe("loading");
    });

- [ ] **Step 2: Run the mapper test and verify RED**

Run:

    npm --prefix website test -- src/features/queues/queue-topology-view-model.test.ts

Expected: FAIL because queue-topology-view-model.ts does not exist.

- [ ] **Step 3: Implement the complete pure mapper**

Create website/src/features/queues/queue-topology-view-model.ts:

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
      exchangeStatus: "loading" | "available" | "unavailable";
      isImplicitDefault: boolean;
    };

    export type QueueTopologyConfig = {
      queue: Queue;
      explicitRoutes: QueueTopologyRoute[];
      systemRoutes: QueueTopologyRoute[];
    };

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

- [ ] **Step 4: Run the mapper tests and verify GREEN**

Run:

    npm --prefix website test -- src/features/queues/queue-topology-view-model.test.ts
    npm --prefix website run typecheck

Expected: mapper tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit Task 2**

    git add website/src/features/queues/queue-topology-view-model.ts website/src/features/queues/queue-topology-view-model.test.ts
    git commit -m "feat: model queue consumer topology"

---

### Task 3: Shared Binding and Exchange configuration queries

**Files:**

- Modify: website/src/domains/bindings/binding-query.ts
- Create: website/src/domains/bindings/binding-query.test.ts
- Modify: website/src/domains/exchanges/exchange-query.ts
- Create: website/src/domains/exchanges/exchange-query.test.ts
- Modify: website/src/features/bindings/binding-list.tsx

**Interfaces:**

- Produces: queueBindingsQueryOptions(apiClient, vhost, queue)
- Produces: exchangeConfigQueryOptions(apiClient, vhost, exchange)
- Consumed by: BindingList and QueueDetailPage

- [ ] **Step 1: Write failing query-options tests**

Create website/src/domains/bindings/binding-query.test.ts:

    import { QueryClient } from "@tanstack/react-query";
    import { describe, expect, it, vi } from "vitest";
    import type { ManagementApiClient } from "@/api/management-api-client";
    import { queueBindingsQueryOptions } from "./binding-query";

    describe("queueBindingsQueryOptions", () => {
      it("uses the queue binding key and encoded queue endpoint", async () => {
        const request = vi.fn().mockResolvedValue([]);
        const apiClient = { request } as unknown as ManagementApiClient;
        const queryClient = new QueryClient({
          defaultOptions: { queries: { retry: false } },
        });
        const options = queueBindingsQueryOptions(
          apiClient,
          "/production",
          "pentest.response",
        );

        expect(options.queryKey).toEqual([
          "bindings",
          "queue",
          "/production",
          "pentest.response",
        ]);
        await queryClient.fetchQuery(options);
        expect(request).toHaveBeenCalledWith(
          "/queues/%2Fproduction/pentest.response/bindings",
          expect.anything(),
          expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
      });
    });

Create website/src/domains/exchanges/exchange-query.test.ts:

    import { QueryClient } from "@tanstack/react-query";
    import { describe, expect, it, vi } from "vitest";
    import type { ManagementApiClient } from "@/api/management-api-client";
    import { mockExchange } from "@/test/fixtures/exchanges";
    import { exchangeConfigQueryOptions } from "./exchange-query";

    describe("exchangeConfigQueryOptions", () => {
      it("requests declaration data without statistics", async () => {
        const request = vi.fn().mockResolvedValue(mockExchange);
        const apiClient = { request } as unknown as ManagementApiClient;
        const queryClient = new QueryClient({
          defaultOptions: { queries: { retry: false } },
        });

        await queryClient.fetchQuery(
          exchangeConfigQueryOptions(apiClient, "/", "pentest.response"),
        );

        expect(request).toHaveBeenCalledWith(
          "/exchanges/%2F/pentest.response?disable_stats=true",
          expect.anything(),
          expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
      });
    });

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

    npm --prefix website test -- src/domains/bindings/binding-query.test.ts src/domains/exchanges/exchange-query.test.ts

Expected: FAIL because both query-options factories are missing.

- [ ] **Step 3: Add queueBindingsQueryOptions**

In website/src/domains/bindings/binding-query.ts, add queryOptions to the TanStack import and getQueueBindings to the API import. Add after bindingKeys:

    export function queueBindingsQueryOptions(
      apiClient: ManagementApiClient,
      vhost: string,
      queue: string,
    ) {
      return queryOptions({
        queryKey: bindingKeys.queue(vhost, queue),
        queryFn: ({ signal }) =>
          getQueueBindings(apiClient, vhost, queue, signal),
      });
    }

The complete imports become:

    import {
      queryOptions,
      useMutation,
      useQueryClient,
    } from "@tanstack/react-query";
    import type { ManagementApiClient } from "@/api/management-api-client";
    import {
      createBinding,
      deleteBinding,
      getQueueBindings,
      type CreateBindingRequest,
    } from "./binding-api";

- [ ] **Step 4: Add exchangeConfigQueryOptions**

In website/src/domains/exchanges/exchange-query.ts, add queryOptions to the TanStack import and getExchange to the API import. Add after exchangeKeys:

    export function exchangeConfigQueryOptions(
      apiClient: ManagementApiClient,
      vhost: string,
      name: string,
    ) {
      const params = new URLSearchParams({ disable_stats: "true" });
      return queryOptions({
        queryKey: [...exchangeKeys.detail(vhost, name), "configuration"] as const,
        queryFn: ({ signal }) =>
          getExchange(apiClient, vhost, name, params, signal),
        staleTime: 60_000,
      });
    }

The API import must contain:

    import {
      createExchange,
      deleteExchange,
      getExchange,
      publishMessage,
      type CreateExchangeRequest,
      type PublishMessageRequest,
    } from "./exchange-api";

- [ ] **Step 5: Reuse the binding options in BindingList**

In website/src/features/bindings/binding-list.tsx, import queueBindingsQueryOptions from binding-query. Replace the single mixed useQuery with two statically ordered queries:

    const queueQuery = useQuery({
      ...queueBindingsQueryOptions(context.apiClient, vhost, resourceName),
      enabled: mode === "to-queue",
      refetchInterval: createPollingInterval(
        PRODUCT_DEFAULTS.polling.heavyListsMs,
      ),
    });

    const exchangeQuery = useQuery({
      queryKey,
      queryFn: ({ signal }) =>
        mode === "to-exchange"
          ? getExchangeBindingsDestination(
              context.apiClient,
              vhost,
              resourceName,
              signal,
            )
          : getExchangeBindingsSource(
              context.apiClient,
              vhost,
              resourceName,
              signal,
            ),
      enabled: mode !== "to-queue",
      refetchInterval: createPollingInterval(
        PRODUCT_DEFAULTS.polling.heavyListsMs,
      ),
    });

    const data = mode === "to-queue" ? queueQuery.data : exchangeQuery.data;
    const isLoading =
      mode === "to-queue" ? queueQuery.isLoading : exchangeQuery.isLoading;

- [ ] **Step 6: Run focused verification and verify GREEN**

Run:

    npm --prefix website test -- src/domains/bindings/binding-query.test.ts src/domains/exchanges/exchange-query.test.ts
    npm --prefix website run typecheck

Expected: selected tests PASS and TypeScript exits 0.

- [ ] **Step 7: Commit Task 3**

    git add website/src/domains/bindings/binding-query.ts website/src/domains/bindings/binding-query.test.ts website/src/domains/exchanges/exchange-query.ts website/src/domains/exchanges/exchange-query.test.ts website/src/features/bindings/binding-list.tsx
    git commit -m "refactor: share topology query options"

---

### Task 4: Queue declaration and Live state components

**Files:**

- Create: website/src/features/queues/queue-configuration-section.tsx
- Create: website/src/features/queues/queue-configuration-section.test.tsx
- Create: website/src/features/queues/queue-live-state.tsx
- Create: website/src/features/queues/queue-live-state.test.tsx
- Modify: website/src/i18n/locales/en.ts
- Modify: website/src/i18n/locales/vi.ts

**Interfaces:**

- Produces: QueueConfigurationSection({ queue })
- Produces: QueueLiveState({ queue, canShowQueueTotals, availabilityReason })
- Consumed by: QueueDetailPage

- [ ] **Step 1: Write failing declaration tests**

Create website/src/features/queues/queue-configuration-section.test.tsx:

    import { screen } from "@testing-library/react";
    import { describe, expect, it } from "vitest";
    import { renderWithProviders } from "@/test/render";
    import { mockQueue } from "@/test/fixtures/queues";
    import { QueueConfigurationSection } from "./queue-configuration-section";

    describe("QueueConfigurationSection", () => {
      it("renders true false and explicit empty arguments", () => {
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

      it("distinguishes unavailable values from false", () => {
        renderWithProviders(
          <QueueConfigurationSection
            queue={{
              name: "partial",
              arguments: { "x-queue-type": "quorum" },
            }}
          />,
        );

        expect(screen.getAllByText("Unavailable").length).toBeGreaterThan(0);
        expect(screen.getByText("x-queue-type:")).toBeVisible();
        expect(screen.getByText("quorum")).toBeVisible();
      });
    });

Create website/src/features/queues/queue-live-state.test.tsx:

    import { screen } from "@testing-library/react";
    import { describe, expect, it } from "vitest";
    import { renderWithProviders } from "@/test/render";
    import { mockQueue } from "@/test/fixtures/queues";
    import { QueueLiveState } from "./queue-live-state";

    describe("QueueLiveState", () => {
      it("renders current backlog consumers and capacity", () => {
        renderWithProviders(
          <QueueLiveState
            queue={{ ...mockQueue, consumer_capacity: 0.94 }}
            canShowQueueTotals
          />,
        );

        expect(screen.getByRole("region", { name: "Ready" })).toHaveTextContent("10");
        expect(screen.getByRole("region", { name: "Unacked" })).toHaveTextContent("5");
        expect(screen.getByRole("region", { name: "Total" })).toHaveTextContent("15");
        expect(screen.getByRole("region", { name: "Consumers" })).toHaveTextContent("2");
        expect(screen.getByRole("region", { name: "Consumer capacity" })).toHaveTextContent("94%");
      });

      it("promotes unavailable statistics and unhealthy replication", () => {
        renderWithProviders(
          <QueueLiveState
            queue={{
              ...mockQueue,
              members: ["rabbit@one", "rabbit@two", "rabbit@three"],
              online: ["rabbit@one"],
            }}
            canShowQueueTotals={false}
            availabilityReason="Queue totals are disabled."
          />,
        );

        expect(screen.getByText("Statistics Unavailable")).toBeVisible();
        expect(screen.getByText("Replication majority unavailable")).toBeVisible();
      });
    });

- [ ] **Step 2: Run both component tests and verify RED**

Run:

    npm --prefix website test -- src/features/queues/queue-configuration-section.test.tsx src/features/queues/queue-live-state.test.tsx

Expected: FAIL because both components are missing.

- [ ] **Step 3: Implement QueueConfigurationSection**

Create website/src/features/queues/queue-configuration-section.tsx:

    import { useTranslation } from "react-i18next";
    import { AmqpValue } from "@/components/shared/amqp-value";
    import { DetailGrid } from "@/components/shared/detail-grid";
    import { SectionCard } from "@/components/shared/section-card";
    import type { Queue } from "@/domains/queues/queue-schema";

    function formatBoolean(
      value: boolean | undefined,
      yes: string,
      no: string,
    ) {
      if (value === undefined) return undefined;
      return value ? yes : no;
    }

    export function QueueConfigurationSection({ queue }: { queue: Queue }) {
      const { t } = useTranslation();
      const argumentsValue = queue.arguments ?? {};
      const renderedArguments =
        Object.keys(argumentsValue).length === 0 ? (
          <span className="font-mono">{"{}"}</span>
        ) : (
          <AmqpValue value={argumentsValue} />
        );

      return (
        <SectionCard
          title={t("queues.configuration")}
          description={t("queues.actualBrokerConfiguration")}
        >
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">
              {t("queues.queueDeclaration")}
            </h3>
            <DetailGrid
              unavailableLabel={t("common.unavailable")}
              items={[
                { label: t("queues.name"), value: queue.name, monospace: true },
                { label: t("queues.vhost"), value: queue.vhost, monospace: true },
                { label: t("queues.type"), value: queue.type },
                {
                  label: t("queues.durable"),
                  value: formatBoolean(
                    queue.durable,
                    t("common.yes"),
                    t("common.no"),
                  ),
                },
                {
                  label: t("queues.autoDelete"),
                  value: formatBoolean(
                    queue.auto_delete,
                    t("common.yes"),
                    t("common.no"),
                  ),
                },
                {
                  label: t("consumerDetails.exclusive"),
                  value: formatBoolean(
                    queue.exclusive,
                    t("common.yes"),
                    t("common.no"),
                  ),
                },
                { label: t("queues.arguments"), value: renderedArguments },
                { label: t("queues.node"), value: queue.node, monospace: true },
              ]}
            />
          </div>
        </SectionCard>
      );
    }

- [ ] **Step 4: Implement QueueLiveState**

Create website/src/features/queues/queue-live-state.tsx:

    import { useTranslation } from "react-i18next";
    import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
    import { MetricCard } from "@/components/shared/metric-card";
    import { StatisticsAvailability } from "@/components/shared/statistics-availability";
    import { Inbox, PackageCheck, Send, Users, Gauge } from "lucide-react";
    import type { Queue } from "@/domains/queues/queue-schema";

    type QueueLiveStateProps = {
      queue: Queue;
      canShowQueueTotals: boolean;
      availabilityReason?: string;
    };

    export function QueueLiveState({
      queue,
      canShowQueueTotals,
      availabilityReason,
    }: QueueLiveStateProps) {
      const { t } = useTranslation();
      const members = queue.members ?? [];
      const online = queue.online ?? [];
      const majorityRequired = Math.floor(members.length / 2) + 1;
      const replicationUnhealthy =
        members.length > 0 && online.length < majorityRequired;
      const capacity = queue.consumer_capacity ?? queue.consumer_utilisation;

      return (
        <section className="space-y-3" aria-labelledby="queue-live-state">
          <div>
            <h2 id="queue-live-state" className="text-base font-semibold">
              {t("queues.liveState")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("queues.liveStateDescription")}
            </p>
          </div>
          {!canShowQueueTotals ? (
            <StatisticsAvailability reason={availabilityReason} />
          ) : null}
          {replicationUnhealthy ? (
            <Alert variant="destructive">
              <AlertTitle>{t("queues.replicationMajorityUnavailable")}</AlertTitle>
              <AlertDescription>
                {t("queues.replicationMajorityUnavailableDescription", {
                  online: online.length,
                  total: members.length,
                })}
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              title={t("queues.ready")}
              value={canShowQueueTotals ? queue.messages_ready ?? 0 : null}
              icon={<Inbox aria-hidden="true" />}
              isUnavailable={!canShowQueueTotals}
              unavailableLabel={t("common.unavailable")}
            />
            <MetricCard
              title={t("queues.unacked")}
              value={
                canShowQueueTotals
                  ? queue.messages_unacknowledged ?? 0
                  : null
              }
              icon={<PackageCheck aria-hidden="true" />}
              status={(queue.messages_unacknowledged ?? 0) > 0 ? "warning" : "normal"}
              isUnavailable={!canShowQueueTotals}
              unavailableLabel={t("common.unavailable")}
            />
            <MetricCard
              title={t("queues.total")}
              value={canShowQueueTotals ? queue.messages ?? 0 : null}
              icon={<Send aria-hidden="true" />}
              isUnavailable={!canShowQueueTotals}
              unavailableLabel={t("common.unavailable")}
            />
            <MetricCard
              title={t("queues.consumers")}
              value={queue.consumers ?? 0}
              icon={<Users aria-hidden="true" />}
            />
            <MetricCard
              title={t("queues.consumerCapacity")}
              value={capacity == null ? null : Math.round(capacity * 100)}
              unit={capacity == null ? undefined : "%"}
              icon={<Gauge aria-hidden="true" />}
              isUnavailable={capacity == null}
              unavailableLabel={t("common.unavailable")}
            />
          </div>
        </section>
      );
    }

- [ ] **Step 5: Add exact English and Vietnamese labels**

Add these keys inside queues in website/src/i18n/locales/en.ts:

    configuration: "Configuration",
    actualBrokerConfiguration: "Actual broker configuration.",
    queueDeclaration: "Queue declaration",
    liveState: "Live state",
    liveStateDescription: "Current backlog, consumers, and capacity.",
    replicationMajorityUnavailable: "Replication majority unavailable",
    replicationMajorityUnavailableDescription:
      "{{online}} of {{total}} members are online. Queue availability is at risk.",

Add the same keys inside queues in website/src/i18n/locales/vi.ts:

    configuration: "Cấu hình",
    actualBrokerConfiguration: "Cấu hình thực tế từ broker.",
    queueDeclaration: "Khai báo queue",
    liveState: "Trạng thái hiện tại",
    liveStateDescription: "Backlog, consumer và capacity hiện tại.",
    replicationMajorityUnavailable: "Không đủ đa số bản sao",
    replicationMajorityUnavailableDescription:
      "{{online}}/{{total}} thành viên đang online. Queue có nguy cơ mất khả dụng.",

- [ ] **Step 6: Run focused verification and verify GREEN**

Run:

    npm --prefix website test -- src/features/queues/queue-configuration-section.test.tsx src/features/queues/queue-live-state.test.tsx src/i18n/i18n.test.ts
    npm --prefix website run typecheck

Expected: all selected tests PASS, locale key sets match, and TypeScript exits 0.

- [ ] **Step 7: Commit Task 4**

    git add website/src/features/queues/queue-configuration-section.tsx website/src/features/queues/queue-configuration-section.test.tsx website/src/features/queues/queue-live-state.tsx website/src/features/queues/queue-live-state.test.tsx website/src/i18n/locales/en.ts website/src/i18n/locales/vi.ts
    git commit -m "feat: show queue declaration and live state"

---

### Task 5: Consumer route presentation

**Files:**

- Create: website/src/features/queues/queue-consumer-routes.tsx
- Create: website/src/features/queues/queue-consumer-routes.test.tsx
- Modify: website/src/i18n/locales/en.ts
- Modify: website/src/i18n/locales/vi.ts

**Interfaces:**

- Consumes: QueueTopologyConfig from Task 2
- Produces: QueueConsumerRoutes(props)
- Emits: onAddBinding(), onRemoveBinding(binding), onRetryBindings(), onRetryExchange(exchangeName)
- Consumed by: QueueDetailPage

- [ ] **Step 1: Write failing route presentation tests**

Create website/src/features/queues/queue-consumer-routes.test.tsx:

    import { screen } from "@testing-library/react";
    import userEvent from "@testing-library/user-event";
    import { describe, expect, it, vi } from "vitest";
    import { renderWithProviders } from "@/test/render";
    import type { Binding } from "@/domains/bindings/binding-schema";
    import { mockQueue } from "@/test/fixtures/queues";
    import type { QueueTopologyConfig } from "./queue-topology-view-model";
    import { QueueConsumerRoutes } from "./queue-consumer-routes";

    const explicitBinding: Binding = {
      source: "pentest.response",
      vhost: "/",
      destination: "my-queue",
      destination_type: "queue",
      routing_key: "",
      arguments: { alternate: true },
      properties_key: "~",
    };

    const systemBinding: Binding = {
      source: "",
      vhost: "/",
      destination: "my-queue",
      destination_type: "queue",
      routing_key: "my-queue",
      arguments: {},
      properties_key: "my-queue",
    };

    function topology(
      exchangeStatus: "available" | "unavailable" = "available",
    ): QueueTopologyConfig {
      return {
        queue: mockQueue,
        explicitRoutes: [
          {
            binding: explicitBinding,
            exchange:
              exchangeStatus === "available"
                ? {
                    name: "pentest.response",
                    vhost: "/",
                    type: "topic",
                    durable: true,
                    arguments: {},
                  }
                : null,
            exchangeStatus,
            isImplicitDefault: false,
          },
        ],
        systemRoutes: [
          {
            binding: systemBinding,
            exchange: null,
            exchangeStatus: "available",
            isImplicitDefault: true,
          },
        ],
      };
    }

    describe("QueueConsumerRoutes", () => {
      it("shows an explicit route and keeps the system binding collapsed", async () => {
        const onRemoveBinding = vi.fn();
        renderWithProviders(
          <QueueConsumerRoutes
            topology={topology()}
            onAddBinding={vi.fn()}
            onRemoveBinding={onRemoveBinding}
            onRetryBindings={vi.fn()}
            onRetryExchange={vi.fn()}
          />,
        );

        expect(screen.getByText("pentest.response")).toBeVisible();
        expect(screen.getByText("topic")).toBeVisible();
        expect(screen.getByText('""')).toBeVisible();
        expect(screen.getByText("alternate:")).toBeVisible();
        expect(screen.queryByText("(AMQP default)")).not.toBeInTheDocument();

        await userEvent.click(
          screen.getByRole("button", { name: "System bindings (1)" }),
        );
        expect(screen.getByText("(AMQP default)")).toBeVisible();

        await userEvent.click(
          screen.getByRole("button", {
            name: "Remove binding from pentest.response",
          }),
        );
        expect(onRemoveBinding).toHaveBeenCalledWith(explicitBinding);
      });

      it("keeps the route visible and retries unavailable exchange data", async () => {
        const onRetryExchange = vi.fn();
        renderWithProviders(
          <QueueConsumerRoutes
            topology={topology("unavailable")}
            onAddBinding={vi.fn()}
            onRemoveBinding={vi.fn()}
            onRetryBindings={vi.fn()}
            onRetryExchange={onRetryExchange}
          />,
        );

        expect(screen.getByText("pentest.response")).toBeVisible();
        expect(screen.getByText("Exchange configuration unavailable")).toBeVisible();
        await userEvent.click(screen.getByRole("button", { name: "Retry" }));
        expect(onRetryExchange).toHaveBeenCalledWith("pentest.response");
      });
    });

- [ ] **Step 2: Run the route tests and verify RED**

Run:

    npm --prefix website test -- src/features/queues/queue-consumer-routes.test.tsx

Expected: FAIL because QueueConsumerRoutes does not exist.

- [ ] **Step 3: Implement QueueConsumerRoutes**

Create website/src/features/queues/queue-consumer-routes.tsx:

    import { useState } from "react";
    import { useTranslation } from "react-i18next";
    import { Link } from "@tanstack/react-router";
    import { ChevronRight, Trash2 } from "lucide-react";
    import { AmqpValue } from "@/components/shared/amqp-value";
    import { AsyncState } from "@/components/shared/async-state";
    import { SectionCard } from "@/components/shared/section-card";
    import { Badge } from "@/components/ui/badge";
    import { Button } from "@/components/ui/button";
    import type { Binding } from "@/domains/bindings/binding-schema";
    import type {
      QueueTopologyConfig,
      QueueTopologyRoute,
    } from "./queue-topology-view-model";

    type QueueConsumerRoutesProps = {
      topology: QueueTopologyConfig;
      isPending?: boolean;
      isError?: boolean;
      hasData?: boolean;
      error?: unknown;
      onAddBinding: () => void;
      onRemoveBinding: (binding: Binding) => void;
      onRetryBindings: () => void;
      onRetryExchange: (exchangeName: string) => void;
    };

    function ArgumentsValue({ value }: { value: Record<string, unknown> }) {
      return Object.keys(value).length === 0 ? (
        <span className="font-mono">{"{}"}</span>
      ) : (
        <AmqpValue value={value} />
      );
    }

    export function QueueConsumerRoutes({
      topology,
      isPending = false,
      isError = false,
      hasData = false,
      error,
      onAddBinding,
      onRemoveBinding,
      onRetryBindings,
      onRetryExchange,
    }: QueueConsumerRoutesProps) {
      const { t } = useTranslation();
      const [systemOpen, setSystemOpen] = useState(false);

      return (
        <SectionCard
          title={t("queues.consumerRoutes")}
          description={t("queues.consumerRoutesDescription", {
            count: topology.explicitRoutes.length,
          })}
          action={
            <Button type="button" size="sm" onClick={onAddBinding}>
              {t("bindings.addBinding")}
            </Button>
          }
        >
          <AsyncState
            isPending={isPending}
            isError={isError}
            hasData={hasData}
            error={error}
            onRetry={onRetryBindings}
            isEmpty={!isPending && topology.explicitRoutes.length === 0}
            emptyTitle={t("queues.noExplicitBindings")}
            emptyDescription={t("queues.noExplicitBindingsDescription")}
          >
            <div className="space-y-3">
              {topology.explicitRoutes.map((route) => (
                <ExplicitRoute
                  key={
                    route.binding.source + "-" + route.binding.properties_key
                  }
                  route={route}
                  queueName={topology.queue.name}
                  onRemove={() => onRemoveBinding(route.binding)}
                  onRetryExchange={onRetryExchange}
                />
              ))}
            </div>
          </AsyncState>

          {topology.systemRoutes.length > 0 ? (
            <details
              className="group mt-4 rounded-xl border border-border/60 bg-muted/20 p-3"
              onToggle={(event) => setSystemOpen(event.currentTarget.open)}
            >
              <summary
                role="button"
                className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium"
              >
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-open:rotate-90"
                />
                {t("queues.systemBindings", {
                  count: topology.systemRoutes.length,
                })}
              </summary>
              {systemOpen ? (
                <div className="mt-3 space-y-2">
                  {topology.systemRoutes.map((route) => (
                    <div
                      key={route.binding.properties_key}
                      className="rounded-lg border bg-background/50 p-3 text-sm"
                    >
                      <span className="font-medium">
                        {t("queues.defaultExchange")}
                      </span>
                      <span className="mx-2 text-muted-foreground">→</span>
                      <span className="font-mono">
                        {route.binding.routing_key}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("queues.systemBindingDescription")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </details>
          ) : null}
        </SectionCard>
      );
    }

    function ExplicitRoute({
      route,
      queueName,
      onRemove,
      onRetryExchange,
    }: {
      route: QueueTopologyRoute;
      queueName: string;
      onRemove: () => void;
      onRetryExchange: (exchangeName: string) => void;
    }) {
      const { t } = useTranslation();
      const exchange = route.exchange;
      const routingKey =
        route.binding.routing_key === "" ? '""' : route.binding.routing_key;
      const routeLabel = t("queues.consumerRouteAccessible", {
        exchange: route.binding.source,
        queue: queueName,
        routingKey,
      });

      return (
        <article
          aria-label={routeLabel}
          className="grid gap-3 rounded-xl border border-border/60 bg-background/30 p-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] lg:items-center"
        >
          <div className="min-w-0 rounded-lg border bg-muted/20 p-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("queues.exchange")}
            </span>
            <Link
              to="/exchanges/$vhost/$name"
              params={{
                vhost: route.binding.vhost,
                name: route.binding.source,
              }}
              className="mt-1 block truncate font-mono font-medium text-primary hover:underline"
            >
              {route.binding.source}
            </Link>
            {route.exchangeStatus === "available" && exchange ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{exchange.type}</Badge>
                <Badge variant="outline">
                  {exchange.durable === undefined
                    ? t("common.unavailable")
                    : exchange.durable
                      ? t("queues.durable")
                      : t("queues.transient")}
                </Badge>
                <ArgumentsValue value={exchange.arguments ?? {}} />
              </div>
            ) : route.exchangeStatus === "loading" ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("common.loading")}
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-destructive">
                  {t("queues.exchangeConfigurationUnavailable")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRetryExchange(route.binding.source)}
                >
                  {t("common.retry")}
                </Button>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-primary">
            <span aria-hidden="true">→</span>
            <span className="block font-mono text-xs">{routingKey}</span>
            <div className="mt-1 text-left text-xs text-muted-foreground">
              <ArgumentsValue value={route.binding.arguments} />
            </div>
          </div>

          <div className="min-w-0 rounded-lg border bg-muted/20 p-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("queues.title")}
            </span>
            <span className="mt-1 block truncate font-mono font-medium">
              {queueName}
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={t("queues.removeBindingFrom", {
              exchange: route.binding.source,
            })}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </article>
      );
    }

- [ ] **Step 4: Add exact route labels to both locales**

Add inside queues in website/src/i18n/locales/en.ts:

    consumerRoutes: "Consumer routes",
    consumerRoutesDescription: "{{count}} explicit incoming binding(s).",
    noExplicitBindings: "No explicit incoming bindings",
    noExplicitBindingsDescription:
      "This queue currently receives only broker-managed default-exchange traffic.",
    systemBindings: "System bindings ({{count}})",
    systemBindingDescription: "Implicit binding managed by RabbitMQ.",
    consumerRouteAccessible:
      "Exchange {{exchange}} routes to queue {{queue}} with binding key {{routingKey}}.",
    exchangeConfigurationUnavailable: "Exchange configuration unavailable",
    removeBindingFrom: "Remove binding from {{exchange}}",

Add inside queues in website/src/i18n/locales/vi.ts:

    consumerRoutes: "Luồng consumer",
    consumerRoutesDescription: "{{count}} binding tường minh đi vào queue.",
    noExplicitBindings: "Không có binding tường minh",
    noExplicitBindingsDescription:
      "Queue hiện chỉ nhận traffic qua default exchange do broker quản lý.",
    systemBindings: "Binding hệ thống ({{count}})",
    systemBindingDescription: "Binding ngầm do RabbitMQ quản lý.",
    consumerRouteAccessible:
      "Exchange {{exchange}} chuyển tới queue {{queue}} bằng binding key {{routingKey}}.",
    exchangeConfigurationUnavailable: "Không tải được cấu hình exchange",
    removeBindingFrom: "Xóa binding từ {{exchange}}",

- [ ] **Step 5: Run focused verification and verify GREEN**

Run:

    npm --prefix website test -- src/features/queues/queue-consumer-routes.test.tsx src/i18n/i18n.test.ts
    npm --prefix website run typecheck

Expected: selected tests PASS, locale keys match, and TypeScript exits 0.

- [ ] **Step 6: Commit Task 5**

    git add website/src/features/queues/queue-consumer-routes.tsx website/src/features/queues/queue-consumer-routes.test.tsx website/src/i18n/locales/en.ts website/src/i18n/locales/vi.ts
    git commit -m "feat: visualize queue consumer routes"

---

### Task 6: Lazy Advanced diagnostics

**Files:**

- Create: website/src/features/queues/queue-advanced-section.tsx
- Create: website/src/features/queues/queue-advanced-section.test.tsx
- Modify: website/src/i18n/locales/en.ts
- Modify: website/src/i18n/locales/vi.ts

**Interfaces:**

- Produces: QueueAdvancedSection({ queue, vhost, name, tracingAvailable, onOpenTracing })
- Consumed by: QueueDetailPage

- [ ] **Step 1: Write the failing lazy-disclosure test**

Create website/src/features/queues/queue-advanced-section.test.tsx:

    import { screen } from "@testing-library/react";
    import userEvent from "@testing-library/user-event";
    import { describe, expect, it, vi } from "vitest";
    import { renderWithProviders } from "@/test/render";
    import { mockQueue } from "@/test/fixtures/queues";
    import { QueueAdvancedSection } from "./queue-advanced-section";

    vi.mock("./message-inspector", () => ({
      MessageInspector: () => (
        <div role="region" aria-label="Message inspector">
          Message inspector content
        </div>
      ),
    }));

    describe("QueueAdvancedSection", () => {
      it("mounts diagnostics only after their disclosure opens", async () => {
        renderWithProviders(
          <QueueAdvancedSection
            queue={{
              ...mockQueue,
              policy: "queue-policy",
              operator_policy: "guardrail",
              effective_policy_definition: { "max-length": 1000 },
              leader: "rabbit@one",
              members: ["rabbit@one", "rabbit@two", "rabbit@three"],
              online: ["rabbit@one", "rabbit@two"],
            }}
            vhost="/"
            name="my-queue"
            tracingAvailable={false}
            onOpenTracing={vi.fn()}
          />,
        );

        expect(
          screen.queryByRole("region", { name: "Message inspector" }),
        ).not.toBeInTheDocument();
        expect(screen.queryByText("queue-policy")).not.toBeInTheDocument();

        await userEvent.click(
          screen.getByRole("button", { name: "Message diagnostics" }),
        );
        expect(
          screen.getByRole("region", { name: "Message inspector" }),
        ).toBeVisible();

        await userEvent.click(
          screen.getByRole("button", { name: "Policies and replication" }),
        );
        expect(screen.getByText("queue-policy")).toBeVisible();
        expect(screen.getByText("guardrail")).toBeVisible();
        expect(screen.getByText("max-length:")).toBeVisible();
        expect(screen.getByText("Majority available")).toBeVisible();
      });
    });

- [ ] **Step 2: Run the Advanced test and verify RED**

Run:

    npm --prefix website test -- src/features/queues/queue-advanced-section.test.tsx

Expected: FAIL because QueueAdvancedSection does not exist.

- [ ] **Step 3: Implement the lazy Advanced section**

Create website/src/features/queues/queue-advanced-section.tsx:

    import { type ReactNode, useState } from "react";
    import { useTranslation } from "react-i18next";
    import { ChevronRight } from "lucide-react";
    import { AmqpValue } from "@/components/shared/amqp-value";
    import { DetailGrid } from "@/components/shared/detail-grid";
    import { QueueReplicationState } from "./queue-replication-state";
    import { MessageInspector } from "./message-inspector";
    import type { Queue } from "@/domains/queues/queue-schema";

    type QueueAdvancedSectionProps = {
      queue: Queue;
      vhost: string;
      name: string;
      tracingAvailable: boolean;
      onOpenTracing: () => void;
    };

    function LazyDisclosure({
      title,
      children,
    }: {
      title: string;
      children: ReactNode;
    }) {
      const [open, setOpen] = useState(false);
      return (
        <details
          className="group rounded-xl border border-border/60 bg-background/30 p-3"
          onToggle={(event) => setOpen(event.currentTarget.open)}
        >
          <summary
            role="button"
            className="flex cursor-pointer list-none items-center gap-2 font-medium"
          >
            <ChevronRight
              aria-hidden="true"
              className="size-4 transition-transform group-open:rotate-90"
            />
            {title}
          </summary>
          {open ? <div className="mt-4">{children}</div> : null}
        </details>
      );
    }

    export function QueueAdvancedSection({
      queue,
      vhost,
      name,
      tracingAvailable,
      onOpenTracing,
    }: QueueAdvancedSectionProps) {
      const { t } = useTranslation();
      const effectivePolicy = queue.effective_policy_definition ?? {};

      return (
        <section className="space-y-3" aria-labelledby="queue-advanced">
          <div>
            <h2 id="queue-advanced" className="text-base font-semibold">
              {t("queues.advanced")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("queues.advancedDescription")}
            </p>
          </div>
          <div className="grid gap-3">
            <LazyDisclosure title={t("queues.messageDiagnostics")}>
              <MessageInspector
                vhost={vhost}
                name={name}
                tracingAvailable={tracingAvailable}
                onOpenTracing={onOpenTracing}
              />
            </LazyDisclosure>
            <LazyDisclosure title={t("queues.policiesAndReplication")}>
              <div className="space-y-5">
                <DetailGrid
                  unavailableLabel={t("common.unavailable")}
                  items={[
                    { label: t("policies.title"), value: queue.policy },
                    {
                      label: t("queues.operatorPolicy"),
                      value: queue.operator_policy,
                    },
                    {
                      label: t("queues.effectivePolicy"),
                      value:
                        Object.keys(effectivePolicy).length === 0 ? (
                          <span className="font-mono">{"{}"}</span>
                        ) : (
                          <AmqpValue value={effectivePolicy} />
                        ),
                    },
                  ]}
                />
                {queue.members?.length ? (
                  <QueueReplicationState
                    leader={queue.leader}
                    members={queue.members}
                    online={queue.online ?? []}
                  />
                ) : null}
              </div>
            </LazyDisclosure>
          </div>
        </section>
      );
    }

- [ ] **Step 4: Add Advanced labels to both locales**

Add inside queues in website/src/i18n/locales/en.ts:

    advanced: "Advanced",
    advancedDescription: "Open these diagnostics only when troubleshooting.",
    messageDiagnostics: "Message diagnostics",
    policiesAndReplication: "Policies and replication",

Add inside queues in website/src/i18n/locales/vi.ts:

    advanced: "Nâng cao",
    advancedDescription: "Chỉ mở các chẩn đoán này khi cần xử lý sự cố.",
    messageDiagnostics: "Chẩn đoán message",
    policiesAndReplication: "Policy và sao chép",

- [ ] **Step 5: Run focused verification and verify GREEN**

Run:

    npm --prefix website test -- src/features/queues/queue-advanced-section.test.tsx src/i18n/i18n.test.ts
    npm --prefix website run typecheck

Expected: selected tests PASS, locale keys match, and TypeScript exits 0.

- [ ] **Step 6: Commit Task 6**

    git add website/src/features/queues/queue-advanced-section.tsx website/src/features/queues/queue-advanced-section.test.tsx website/src/i18n/locales/en.ts website/src/i18n/locales/vi.ts
    git commit -m "feat: group advanced queue diagnostics"

---

### Task 7: Integrate the topology-first Queue Detail page

**Files:**

- Modify: website/src/features/queues/queue-detail-page.tsx
- Modify: website/src/features/queues/queue-detail-page.test.tsx
- Modify: website/src/test/fixtures/queues.ts
- Modify: website/src/i18n/locales/en.ts
- Modify: website/src/i18n/locales/vi.ts

**Interfaces:**

- Consumes: all Task 1–6 interfaces
- Preserves: existing Queue Detail actions, Message counts history, Consumers, stream publishers
- Removes: Message rates history, old Properties card, bottom BindingList, always-open MessageInspector and replication blocks

- [ ] **Step 1: Enrich the queue fixture with declaration and count history**

In website/src/test/fixtures/queues.ts, set these fields on mockQueue:

    arguments: { "x-max-priority": 10 },
    consumer_capacity: 0.94,
    messages_details: {
      rate: 0,
      samples: [
        { timestamp: 1_783_851_200, sample: 15 },
        { timestamp: 1_783_851_205, sample: 16 },
      ],
    },
    messages_ready_details: {
      rate: 0,
      samples: [
        { timestamp: 1_783_851_200, sample: 10 },
        { timestamp: 1_783_851_205, sample: 11 },
      ],
    },
    messages_unacknowledged_details: {
      rate: 0,
      samples: [
        { timestamp: 1_783_851_200, sample: 5 },
        { timestamp: 1_783_851_205, sample: 5 },
      ],
    },

- [ ] **Step 2: Replace the main Queue Detail regression test with the approved behavior**

In website/src/features/queues/queue-detail-page.test.tsx, add beforeEach to the Vitest import and setup:

    import { beforeEach, describe, expect, it, vi } from "vitest";

    beforeEach(() => {
      vi.clearAllMocks();
    });

Define these fixtures above describe:

    const overview = {
      disable_stats: false,
      rates_mode: "detailed",
      enable_queue_totals: true,
      object_totals: {},
      message_stats: {},
    };

    const bindings = [
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
        source: "pentest.response",
        vhost: "/",
        destination: "my-queue",
        destination_type: "queue",
        routing_key: "scan.#",
        arguments: {},
        properties_key: "scan.%23",
      },
    ];

    function mockQueueDetailRequests() {
      mockClient.request.mockImplementation(async (path: string) => {
        if (path === "/overview") return overview;
        if (path === "/extensions") return [];
        if (path.includes("/bindings")) return bindings;
        if (path.startsWith("/exchanges/")) {
          return {
            name: "pentest.response",
            vhost: "/",
            type: "topic",
            durable: true,
            auto_delete: false,
            internal: false,
            arguments: {},
          };
        }
        return mockQueue;
      });
    }

Replace the first test with:

    it("renders topology-first configuration and keeps count history", async () => {
      mockQueueDetailRequests();
      render(
        <QueueDetailPage vhost="/" name="my-queue" />,
        { wrapper: createWrapper() },
      );

      expect(
        await screen.findByRole("region", { name: "Configuration" }),
      ).toBeVisible();
      expect(screen.getByText("Queue declaration")).toBeVisible();
      expect(screen.getByText("pentest.response")).toBeVisible();
      expect(screen.getByText("topic")).toBeVisible();
      expect(screen.getByText("scan.#")).toBeVisible();
      expect(screen.getByText("x-max-priority:")).toBeVisible();
      expect(screen.getByText("Message counts history")).toBeVisible();
      expect(screen.queryByText("Message rates history")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("region", { name: "Message inspector" }),
      ).not.toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", { name: "Message diagnostics" }),
      );
      expect(
        screen.getByRole("region", { name: "Message inspector" }),
      ).toBeVisible();
    });

Update the remaining tests to call mockQueueDetailRequests() before render. In the mirrored queue test, override only the queue response:

    mockQueueDetailRequests();
    mockClient.request.mockImplementation(async (path: string) => {
      if (path === "/overview") return overview;
      if (path === "/extensions") return [];
      if (path.includes("/bindings")) return bindings;
      if (path.startsWith("/exchanges/")) {
        return {
          name: "pentest.response",
          type: "topic",
          durable: true,
          arguments: {},
        };
      }
      return {
        ...mockQueue,
        slave_nodes: ["rabbit@two"],
        synchronised_slave_nodes: [],
      };
    });

- [ ] **Step 3: Run Queue Detail tests and verify RED**

Run:

    npm --prefix website test -- src/features/queues/queue-detail-page.test.tsx

Expected: FAIL because the old page lacks Configuration and Consumer routes, still renders Message rates history when samples exist, and mounts Message Inspector immediately.

- [ ] **Step 4: Wire bindings and exchange declaration queries**

In website/src/features/queues/queue-detail-page.tsx:

1. Add useQueries to the TanStack import.
2. Import queueBindingsQueryOptions, exchangeConfigQueryOptions, QueueConfigurationSection, QueueConsumerRoutes, QueueLiveState, QueueAdvancedSection, createQueueTopologyConfig, listExplicitSourceExchanges, and ExchangeLookupState.
3. Import CreateBindingDialog, useDeleteBindingMutation, and Binding.
4. Remove BindingList, DetailGrid, SectionCard-only Properties dependencies, objectToStructuredEntries, and direct MessageInspector/QueueReplicationState imports that are no longer used.

Add state with the other dialogs:

    const [createBindingOpen, setCreateBindingOpen] = useState(false);
    const [bindingToDelete, setBindingToDelete] = useState<Binding | null>(null);

Add the binding mutation with the other mutations:

    const deleteBindingMutation = useDeleteBindingMutation(context.apiClient);

After the Queue query, add:

    const bindingsQuery = useQuery({
      ...queueBindingsQueryOptions(context.apiClient, vhost, name),
      refetchInterval: createPollingInterval(
        PRODUCT_DEFAULTS.polling.heavyListsMs,
      ),
    });

    const explicitExchangeNames = useMemo(
      () => listExplicitSourceExchanges(bindingsQuery.data ?? []),
      [bindingsQuery.data],
    );

    const exchangeQueries = useQueries({
      queries: explicitExchangeNames.map((exchangeName) =>
        exchangeConfigQueryOptions(context.apiClient, vhost, exchangeName),
      ),
    });

    const exchangeLookups = useMemo<Record<string, ExchangeLookupState>>(
      () =>
        Object.fromEntries(
          explicitExchangeNames.map((exchangeName, index) => {
            const query = exchangeQueries[index];
            const state: ExchangeLookupState = query?.data
              ? { status: "available", exchange: query.data }
              : query?.isError
                ? { status: "unavailable", exchange: null }
                : { status: "loading", exchange: null };
            return [exchangeName, state];
          }),
        ),
      [exchangeQueries, explicitExchangeNames],
    );

    const topology = useMemo(
      () =>
        queue
          ? createQueueTopologyConfig(
              queue,
              bindingsQuery.data ?? [],
              exchangeLookups,
            )
          : null,
      [bindingsQuery.data, exchangeLookups, queue],
    );

    const retryExchange = (exchangeName: string) => {
      const index = explicitExchangeNames.indexOf(exchangeName);
      if (index >= 0) {
        void exchangeQueries[index]?.refetch();
      }
    };

- [ ] **Step 5: Remove Message rates transformation and render the approved section order**

Delete msgRateSeries completely. Keep msgCountSeries unchanged.

Replace the old Properties/Message counts/Message rates block and the later standalone MessageInspector, replication, and BindingList blocks with:

    {queue && topology ? (
      <>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <QueueConfigurationSection queue={queue} />
          <QueueConsumerRoutes
            topology={topology}
            isPending={bindingsQuery.isPending}
            isError={bindingsQuery.isError}
            hasData={(bindingsQuery.data?.length ?? 0) > 0}
            error={bindingsQuery.error}
            onAddBinding={() => setCreateBindingOpen(true)}
            onRemoveBinding={setBindingToDelete}
            onRetryBindings={() => void bindingsQuery.refetch()}
            onRetryExchange={retryExchange}
          />
        </div>

        <QueueLiveState
          queue={queue}
          canShowQueueTotals={statsCapabilities.canShowQueueTotals}
          availabilityReason={statsCapabilities.availabilityReason}
        />
      </>
    ) : null}

    {(!statsCapabilities.canShowQueueTotals || msgCountSeries.length > 0) && (
      <section
        className="space-y-3"
        aria-label={t("queues.messageCountChart")}
      >
        <RateChart
          title={t("queues.messageCountChart")}
          unit="msgs"
          series={msgCountSeries}
          selectedRange={range}
          onRangeChange={setRange}
          isAvailable={statsCapabilities.canShowQueueTotals}
          availabilityReason={statsCapabilities.availabilityReason}
          showDataTable={false}
          chartClassName="h-80"
        />
      </section>
    )}

    <section className="space-y-3" aria-label={t("queues.consumersDetail")}>
      <h2 className="text-base font-semibold tracking-tight">
        {t("queues.consumersDetail")}
      </h2>
      <ConsumerTable consumers={queue?.consumer_details ?? []} />
    </section>

Keep the existing conditional StreamPublisherTable immediately after Consumers.

Render Advanced after stream publishers:

    {queue ? (
      <QueueAdvancedSection
        queue={queue}
        vhost={vhost}
        name={name}
        tracingAvailable={canUseTracing}
        onOpenTracing={() => navigate({ to: "/extensions/tracing" })}
      />
    ) : null}

Add the create and delete binding dialogs next to the other dialogs:

    <CreateBindingDialog
      vhost={vhost}
      resourceName={name}
      mode="to-queue"
      open={createBindingOpen}
      onOpenChange={setCreateBindingOpen}
    />

    <ConfirmDialog
      open={bindingToDelete !== null}
      onOpenChange={(open) => {
        if (!open) setBindingToDelete(null);
      }}
      title={t("bindings.removeBinding")}
      description={
        bindingToDelete ? (
          <>
            {t("bindings.removeConfirm")}{" "}
            <strong>{bindingToDelete.source}</strong>{" "}
            {t("bindings.and")}{" "}
            <strong>{bindingToDelete.destination}</strong>?
          </>
        ) : null
      }
      confirmText={t("common.remove")}
      variant="destructive"
      isConfirming={deleteBindingMutation.isPending}
      error={deleteBindingMutation.error}
      onConfirm={() => {
        if (!bindingToDelete) return;
        deleteBindingMutation.mutate(
          {
            vhost,
            exchange: bindingToDelete.source,
            destinationType: "q",
            destination: bindingToDelete.destination,
            propertiesKey: bindingToDelete.properties_key,
          },
          { onSuccess: () => setBindingToDelete(null) },
        );
      }}
    />

Delete queues.messageRates from both locale files. Keep publishRate, deliverRate, and ackRate because Queue list columns consume them.

- [ ] **Step 6: Run integration verification and verify GREEN**

Run:

    npm --prefix website test -- src/features/queues
    npm --prefix website test -- src/domains/queues src/domains/bindings src/domains/exchanges
    npm --prefix website run typecheck
    npm --prefix website run lint

Expected: all selected tests PASS, TypeScript exits 0, and lint exits 0.

- [ ] **Step 7: Commit Task 7**

    git add website/src/features/queues/queue-detail-page.tsx website/src/features/queues/queue-detail-page.test.tsx website/src/test/fixtures/queues.ts website/src/i18n/locales/en.ts website/src/i18n/locales/vi.ts
    git commit -m "feat: redesign queue detail around consumer topology"

---

### Task 8: Cold-navigation request budget and final verification

**Files:**

- Modify: website/tests/e2e/performance.spec.ts

**Interfaces:**

- Verifies: one Queue detail HTTP request on cold navigation
- Verifies: lengths parameters are present and msg_rates parameters are absent
- Verifies: topology-first Configuration is visible

- [ ] **Step 1: Add the failing Playwright regression**

Append this test inside the existing Performance Budgets describe block in website/tests/e2e/performance.spec.ts:

    test("Queue detail cold navigation makes one count-only detail request", async ({
      page,
    }) => {
      const queue = {
        name: "orders",
        vhost: "/",
        type: "classic",
        node: "rabbit@localhost",
        state: "running",
        durable: true,
        auto_delete: false,
        exclusive: false,
        arguments: {},
        messages: 15,
        messages_ready: 10,
        messages_unacknowledged: 5,
        consumers: 2,
        consumer_capacity: 0.9,
        messages_details: {
          rate: 0,
          samples: [{ timestamp: 1_783_851_200, sample: 15 }],
        },
        messages_ready_details: {
          rate: 0,
          samples: [{ timestamp: 1_783_851_200, sample: 10 }],
        },
        messages_unacknowledged_details: {
          rate: 0,
          samples: [{ timestamp: 1_783_851_200, sample: 5 }],
        },
      };
      let detailRequests = 0;
      let detailUrl = "";

      await page.route("**/api/queues*", async (route) => {
        const url = new URL(route.request().url());
        if (url.pathname.endsWith("/api/queues/%2F/orders/bindings")) {
          await route.fulfill({
            json: [
              {
                source: "orders.events",
                vhost: "/",
                destination: "orders",
                destination_type: "queue",
                routing_key: "orders.#",
                arguments: {},
                properties_key: "orders.%23",
              },
            ],
          });
          return;
        }
        if (url.pathname.endsWith("/api/queues/%2F/orders")) {
          detailRequests += 1;
          detailUrl = url.toString();
          await route.fulfill({ json: queue });
          return;
        }
        await route.fulfill({
          json: {
            items: [queue],
            filtered_count: 1,
            item_count: 1,
            page: 1,
            page_count: 1,
            page_size: 100,
            total_count: 1,
          },
        });
      });

      await page.route("**/api/exchanges/%2F/orders.events*", async (route) => {
        await route.fulfill({
          json: {
            name: "orders.events",
            vhost: "/",
            type: "topic",
            durable: true,
            auto_delete: false,
            internal: false,
            arguments: {},
          },
        });
      });

      await page.goto("/login");
      await page.getByLabel("Username").fill("operator");
      await page.locator("#password").fill("secret");
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page.getByRole("region", { name: "Cluster health" })).toBeVisible();

      await navigateTo(page, "Queues and Streams");
      await page.getByRole("link", { name: "orders", exact: true }).click();
      await expect(
        page.getByRole("region", { name: "Configuration" }),
      ).toBeVisible();

      expect(detailRequests).toBe(1);
      expect(detailUrl).toContain("lengths_age=60");
      expect(detailUrl).toContain("lengths_incr=5");
      expect(detailUrl).not.toContain("msg_rates");
      await expect(page.getByText("Message counts history")).toBeVisible();
      await expect(page.getByText("Message rates history")).toHaveCount(0);
    });

- [ ] **Step 2: Run the focused E2E test and verify its result**

Run:

    npm --prefix website run test:e2e -- --grep "Queue detail cold navigation"

Expected after Tasks 1–7: PASS with detailRequests equal to 1. If it fails, inspect the counted URLs and fix cache identity or route mocks; do not increase an assertion limit.

- [ ] **Step 3: Run the complete repository verification**

Run each command and require exit code 0:

    npm --prefix website run lint
    npm --prefix website run typecheck
    npm --prefix website run test
    npm --prefix website run build
    npm --prefix website run check:bundle
    npm --prefix website run test:e2e

Expected:

- oxlint reports zero errors.
- TypeScript reports zero errors.
- Vitest reports zero failed tests.
- Vite production build exits 0.
- Bundle-budget verification passes.
- Playwright reports zero failed tests.

- [ ] **Step 4: Inspect the final diff against the approved spec**

Run:

    git diff --check
    git status --short
    git diff --stat ea3e6c5..HEAD

Confirm all of these manually:

- Queue Detail has no Message rates history render path.
- Queue Detail keeps Message counts history.
- Queue Detail range query contains lengths only.
- Queue declaration arguments and explicit booleans are visible.
- Every explicit binding remains represented.
- Default exchange is under System bindings.
- Exchange failure does not remove its binding route.
- Existing Publish, Move, Purge, Remove, mirror actions, Consumers, and stream publishers remain.
- No unrelated repository-wide optimization is mixed into this branch.

- [ ] **Step 5: Commit Task 8**

    git add website/tests/e2e/performance.spec.ts
    git commit -m "test: guard queue detail request budget"

---

## Execution Checkpoints

- After Task 1: loader/page cache identity and count-only query are independently verified.
- After Task 3: all topology data sources have reusable query contracts.
- After Task 5: broker topology can be inspected without the full page integration.
- After Task 7: the approved Queue Detail experience is functional.
- After Task 8: unit, build, bundle, accessibility-adjacent component behavior, and end-to-end request budgets are verified.

## Follow-up After This Plan

Return to the separate system optimization track from the design spec. Start with measured duplicate detail requests on Exchange and Connection, App Shell Overview blocking/polling, high-cardinality Binding tables, and transitive initial-bundle budgeting. Do not fold those changes into this feature's commits.
