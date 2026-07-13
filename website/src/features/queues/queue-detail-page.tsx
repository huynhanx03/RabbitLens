import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";

import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { AmqpValue } from "@/components/shared/amqp-value";
import { SectionCard } from "@/components/shared/section-card";
import { RateChart, type RateChartSeries } from "@/components/shared/rate-chart";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";

import {
  queueDetailQueryOptions,
  usePurgeQueueMutation,
  useQueueActionMutation,
} from "@/domains/queues/queue-query";
import type { QueueAction } from "@/domains/queues/queue-api";
import { createQueueViewModel } from "./queue-view-model";
import { DeleteQueueDialog } from "./delete-queue-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CreateBindingDialog } from "../bindings/create-binding-dialog";
import {
  queueBindingsQueryOptions,
  useDeleteBindingMutation,
} from "@/domains/bindings/binding-query";
import type { Binding } from "@/domains/bindings/binding-schema";
import { exchangeConfigQueryOptions } from "@/domains/exchanges/exchange-query";

import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { CHART_RANGES } from "@/config/chart-ranges";
import { ChevronLeft, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { overviewQueryOptions } from "@/domains/overview/overview-query";
import { resolveStatisticsMode, getStatisticsSelectors } from "@/api/statistics-capabilities";
import { AsyncState } from "@/components/shared/async-state";
import { ConsumerTable } from "@/features/consumers/consumer-table";
import { PublishMessageDialog } from "@/features/exchanges/publish-message-dialog";
import { getStreamQueuePublishers } from "@/domains/extensions/streams/stream-api";
import { StreamPublisherTable } from "@/features/streams/stream-publisher-table";
import { extensionsQueryOptions } from "@/domains/extensions/extension-query";
import { isExtensionInstalled } from "@/extensions/extension-registry";
import { MoveMessagesDialog } from "./move-messages-dialog";
import { QueueAdvancedSection } from "./queue-advanced-section";
import { QueueConfigurationSection } from "./queue-configuration-section";
import { QueueConsumerRoutes } from "./queue-consumer-routes";
import { QueueLiveState } from "./queue-live-state";
import {
  createQueueTopologyConfig,
  listExplicitSourceExchanges,
  resolveExchangeLookupState,
  type ExchangeLookupState,
} from "./queue-topology-view-model";

type QueueDetailPageProps = {
  vhost: string;
  name: string;
};

export function QueueDetailPage({ vhost, name }: QueueDetailPageProps) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const navigate = useNavigate();
  const [range, setRange] = useState(CHART_RANGES[0]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purgeDialogOpen, setPurgeDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [queueAction, setQueueAction] = useState<QueueAction | null>(null);
  const [createBindingOpen, setCreateBindingOpen] = useState(false);
  const [bindingToDelete, setBindingToDelete] = useState<Binding | null>(null);

  const extensionsQuery = useQuery(extensionsQueryOptions(context.apiClient));
  const tags = context.auth?.user?.tags ?? [];
  const canMoveMessages =
    isExtensionInstalled("shovel", extensionsQuery.data ?? []) &&
    (tags.includes("administrator") || tags.includes("policymaker"));
  const canUseTracing =
    isExtensionInstalled("tracing", extensionsQuery.data ?? []) &&
    tags.includes("administrator");

  const overviewQuery = useQuery(
    overviewQueryOptions(context.apiClient, () => true),
  );
  const statsMode = resolveStatisticsMode(overviewQuery.data);
  const statsCapabilities = getStatisticsSelectors(statsMode);

  const purgeMutation = usePurgeQueueMutation(context.apiClient);
  const queueActionMutation = useQueueActionMutation(context.apiClient);
  const deleteBindingMutation = useDeleteBindingMutation(context.apiClient);

  const { data: queue } = useQuery({
    ...queueDetailQueryOptions(context.apiClient, vhost, name, range),
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.nodeDetailsMs),
  });

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
          const state: ExchangeLookupState = resolveExchangeLookupState(
            query?.data,
            query?.isError ?? false,
          );
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

  const vm = queue ? createQueueViewModel(queue) : null;
  const streamPublishers = useQuery({
    queryKey: ["stream-publishers", vhost, name],
    queryFn: ({ signal }) => getStreamQueuePublishers(context.apiClient, vhost, name, signal),
    enabled: queue?.type === "stream",
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.nodeDetailsMs),
  });

  const msgCountSeries = useMemo<RateChartSeries[]>(() => {
    if (!queue?.messages_details?.samples && !queue?.messages_ready_details?.samples) return [];
    const series: RateChartSeries[] = [];
    if (queue.messages_details?.samples) {
      series.push({
        name: t("queues.total"),
        data: queue.messages_details.samples.map((sample) => [sample.timestamp, sample.sample])
      });
    }
    if (queue.messages_ready_details?.samples) {
      series.push({
        name: t("queues.ready"),
        data: queue.messages_ready_details.samples.map((sample) => [sample.timestamp, sample.sample])
      });
    }
    if (queue.messages_unacknowledged_details?.samples) {
      series.push({
        name: t("queues.unacked"),
        data: queue.messages_unacknowledged_details.samples.map((sample) => [sample.timestamp, sample.sample])
      });
    }
    return series;
  }, [queue, t]);

  const stateVariant = vm?.state === "running" ? "success" : vm?.state === "idle" ? "info" : vm?.state === "flow" ? "warning" : "error";
  const featureBadges = vm?.features ?? [];
  const queueType = vm?.type;

  return (
    <div className="space-y-6">
      <DetailPageHeader
        backAction={
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate({
              to: "/queues",
              search: {
                page: 1,
                pageSize: PRODUCT_DEFAULTS.tables.defaultPageSize,
                name: "",
                useRegex: false,
                sortReverse: false,
              },
            })}
            aria-label={t("common.back")}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
        }
        title={name}
        description={t("queues.detailDescription")}
        status={vm?.state ? <StatusBadge variant={stateVariant}>{vm.state}</StatusBadge> : null}
        metadata={[
          <Badge
            key="vhost"
            variant="outline"
            className="h-7 border-border/70 bg-background/50 px-3 font-mono text-muted-foreground"
          >
            {vhost}
          </Badge>,
          queueType ? (
            <Badge
              key="type"
              variant="secondary"
              className={
                queueType === "stream"
                  ? "h-7 border-sky-500/30 bg-sky-500/10 px-3 font-mono text-sky-700 dark:text-sky-300"
                  : "h-7 border-primary/25 bg-primary/10 px-3 font-mono text-primary"
              }
            >
              {queueType}
            </Badge>
          ) : null,
          vm?.node ? (
            <Badge
              key="node"
              variant="outline"
              className="h-7 border-primary/25 bg-primary/10 px-3 font-mono text-primary"
            >
              {vm.node}
            </Badge>
          ) : null,
          ...featureBadges.map((feature) => (
            <Badge
              key={feature}
              variant="outline"
              className="h-7 border-emerald-500/30 bg-emerald-500/10 px-3 font-mono text-emerald-700 dark:text-emerald-300"
            >
              {feature}
            </Badge>
          )),
        ].filter(Boolean)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setPublishDialogOpen(true)}>
              <Upload aria-hidden="true" />
              {t("exchanges.publishMessage")}
            </Button>
            {canMoveMessages ? <Button variant="outline" onClick={() => setMoveDialogOpen(true)}>{t("queues.moveMessages")}</Button> : null}
            {queue?.slave_nodes?.length ? <Button variant="outline" onClick={() => setQueueAction("sync")}>{t("queues.syncMirrors")}</Button> : null}
            {queue?.state === "syncing" ? <Button variant="outline" onClick={() => setQueueAction("cancel_sync")}>{t("queues.cancelSync")}</Button> : null}
            <Button
              variant="outline"
              className="border-destructive/30 text-destructive hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setPurgeDialogOpen(true)}
            >
              <Trash2 aria-hidden="true" />
              {t("queues.purge")}
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 aria-hidden="true" />
              {t("common.remove")}
            </Button>
          </div>
        }
      />

      <PublishMessageDialog
        vhost={vhost}
        name=""
        initialRoutingKey={name}
        lockRoutingKey
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
      />

      <MoveMessagesDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        vhost={vhost}
        sourceQueue={name}
        queueType={queue?.type}
      />

      <ConfirmDialog
        open={queueAction !== null}
        onOpenChange={(open) => { if (!open) setQueueAction(null); }}
        title={queueAction === "cancel_sync" ? t("queues.cancelSync") : t("queues.syncMirrors")}
        description={t("queues.queueActionWarning", { queue: name })}
        confirmText={queueAction === "cancel_sync" ? t("queues.cancelSync") : t("queues.syncMirrors")}
        isConfirming={queueActionMutation.isPending}
        error={queueActionMutation.error}
        onConfirm={() => {
          if (!queueAction) return;
          queueActionMutation.mutate({ vhost, name, action: queueAction }, { onSuccess: () => setQueueAction(null) });
        }}
      />

      <ConfirmDialog
        open={purgeDialogOpen}
        onOpenChange={setPurgeDialogOpen}
        title={t("queues.purge")}
        description={
          <>
            {t("queues.purgeConfirm")} <strong>{name}</strong>
          </>
        }
        confirmText={t("queues.purge")}
        variant="destructive"
        isConfirming={purgeMutation.isPending}
        error={purgeMutation.error}
        onConfirm={() => {
          purgeMutation.mutate(
            { vhost, name },
            {
              onSuccess: () => setPurgeDialogOpen(false),
            }
          );
        }}
      />

      <DeleteQueueDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        vhost={vhost}
        name={name}
      />

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
            <div>
              {t("bindings.removeConfirm")} {" "}
              <strong>{bindingToDelete.source}</strong> {t("bindings.and")} {" "}
              <strong>{bindingToDelete.destination}</strong>?
              <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted-foreground">
                  {t("bindings.routingKey")}
                </dt>
                <dd className="font-mono">
                  {bindingToDelete.routing_key === ""
                    ? '""'
                    : bindingToDelete.routing_key}
                </dd>
                <dt className="text-muted-foreground">
                  {t("bindings.arguments")}
                </dt>
                <dd>
                  {Object.keys(bindingToDelete.arguments).length === 0 ? (
                    <span className="font-mono">{"{}"}</span>
                  ) : (
                    <AmqpValue value={bindingToDelete.arguments} />
                  )}
                </dd>
              </dl>
            </div>
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

      {(!statsCapabilities.canPollSamples || msgCountSeries.length > 0) && (
        <section className="space-y-3" aria-label={t("queues.messageCountChart")}>
          <RateChart
            title={t("queues.messageCountChart")}
            unit="msgs"
            series={msgCountSeries}
            selectedRange={range}
            onRangeChange={setRange}
            isAvailable={statsCapabilities.canPollSamples}
            availabilityReason={statsCapabilities.availabilityReason}
            showDataTable={false}
            chartClassName="h-80"
          />
        </section>
      )}

      <section className="space-y-3" aria-label={t("queues.consumersDetail")}>
        <h2 className="text-base font-semibold tracking-tight">{t("queues.consumersDetail")}</h2>
        <ConsumerTable consumers={queue?.consumer_details ?? []} />
      </section>

      {queue?.type === "stream" ? (
        <SectionCard title={t("streams.publishers")}>
          <AsyncState isPending={streamPublishers.isPending} isError={streamPublishers.isError} error={streamPublishers.error} onRetry={() => void streamPublishers.refetch()}>
            <StreamPublisherTable publishers={streamPublishers.data ?? []} />
          </AsyncState>
        </SectionCard>
      ) : null}

      {queue ? (
        <QueueAdvancedSection
          queue={queue}
          vhost={vhost}
          name={name}
          tracingAvailable={canUseTracing}
          onOpenTracing={() => navigate({ to: "/extensions/tracing" })}
        />
      ) : null}
    </div>
  );
}
