import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";

import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { DetailGrid } from "@/components/shared/detail-grid";
import { MetricCard } from "@/components/shared/metric-card";
import { SectionCard } from "@/components/shared/section-card";
import { RateChart, type RateChartSeries } from "@/components/shared/rate-chart";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { objectToStructuredEntries } from "@/components/shared/structured-key-value-utils";

import { getQueue } from "@/domains/queues/queue-api";
import { queueKeys, usePurgeQueueMutation, useQueueActionMutation } from "@/domains/queues/queue-query";
import type { QueueAction } from "@/domains/queues/queue-api";
import { createQueueViewModel } from "./queue-view-model";
import { DeleteQueueDialog } from "./delete-queue-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { BindingList } from "../bindings/binding-list";

import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { CHART_RANGES, buildRangeQueryParams, QUEUE_RANGE_PREFIXES } from "@/config/chart-ranges";
import { ChevronLeft, Inbox, PackageCheck, Send, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { overviewQueryOptions } from "@/domains/overview/overview-query";
import { resolveStatisticsMode, getStatisticsSelectors } from "@/api/statistics-capabilities";
import { StatisticsAvailability } from "@/components/shared/statistics-availability";
import { AsyncState } from "@/components/shared/async-state";
import { ConsumerTable } from "@/features/consumers/consumer-table";
import { QueueReplicationState } from "./queue-replication-state";
import { PublishMessageDialog } from "@/features/exchanges/publish-message-dialog";
import { getStreamQueuePublishers } from "@/domains/extensions/streams/stream-api";
import { StreamPublisherTable } from "@/features/streams/stream-publisher-table";
import { extensionsQueryOptions } from "@/domains/extensions/extension-query";
import { isExtensionInstalled } from "@/extensions/extension-registry";
import { MoveMessagesDialog } from "./move-messages-dialog";
import { MessageInspector } from "./message-inspector";

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

  const { data: queue } = useQuery({
    queryKey: [...queueKeys.detail(vhost, name), range, statsCapabilities.canShowRates, statsCapabilities.canShowQueueTotals],
    queryFn: ({ signal }) =>
      getQueue(
        context.apiClient,
        vhost,
        name,
        statsCapabilities.canShowRates || statsCapabilities.canShowQueueTotals 
          ? buildRangeQueryParams(range, QUEUE_RANGE_PREFIXES) 
          : undefined,
        signal,
      ),
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.nodeDetailsMs),
  });

  const vm = queue ? createQueueViewModel(queue) : null;
  const streamPublishers = useQuery({
    queryKey: ["stream-publishers", vhost, name],
    queryFn: ({ signal }) => getStreamQueuePublishers(context.apiClient, vhost, name, signal),
    enabled: queue?.type === "stream",
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.nodeDetailsMs),
  });

  const msgRateSeries = useMemo<RateChartSeries[]>(() => {
    if (!queue?.message_stats) return [];
    const series: RateChartSeries[] = [];
    if (queue.message_stats.publish_details?.samples) {
      series.push({
        name: t("queues.publishRate"),
        data: queue.message_stats.publish_details.samples.map((sample) => [sample.timestamp, sample.sample])
      });
    }
    if (queue.message_stats.deliver_get_details?.samples) {
      series.push({
        name: t("queues.deliverRate"),
        data: queue.message_stats.deliver_get_details.samples.map((sample) => [sample.timestamp, sample.sample])
      });
    }
    if (queue.message_stats.ack_details?.samples) {
      series.push({
        name: t("queues.ackRate"),
        data: queue.message_stats.ack_details.samples.map((sample) => [sample.timestamp, sample.sample])
      });
    }
    return series;
  }, [queue, t]);

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

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title={t("queues.properties")}>
          <DetailGrid
            unavailableLabel={t("common.unavailable")}
            items={[
              { label: t("queues.consumers"), value: vm?.consumers ?? 0 },
              { label: t("policies.title"), value: queue?.policy },
              { label: t("queues.operatorPolicy"), value: queue?.operator_policy },
              { label: t("queues.consumerCapacity"), value: queue?.consumer_capacity ?? queue?.consumer_utilisation },
              ...(queue?.effective_policy_definition
                ? objectToStructuredEntries(queue.effective_policy_definition).map((entry) => ({
                    label: entry.key,
                    value: entry.value,
                  }))
                : []),
            ]}
          />
        </SectionCard>

        <SectionCard
          title={t("queues.messageCounts")}
          description={t("queues.messageCountsDescription")}
        >
          {!statsCapabilities.canShowQueueTotals ? (
            <div className="mb-4">
              <StatisticsAvailability reason={statsCapabilities.availabilityReason} />
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              title={t("queues.ready")}
              value={statsCapabilities.canShowQueueTotals ? (vm?.messagesReady ?? 0) : null}
              icon={<Inbox aria-hidden="true" />}
              isUnavailable={!statsCapabilities.canShowQueueTotals}
              unavailableLabel={t("common.unavailable")}
            />
            <MetricCard
              title={t("queues.unacked")}
              value={statsCapabilities.canShowQueueTotals ? (vm?.messagesUnacked ?? 0) : null}
              icon={<PackageCheck aria-hidden="true" />}
              status={(vm?.messagesUnacked ?? 0) > 0 ? "warning" : "normal"}
              isUnavailable={!statsCapabilities.canShowQueueTotals}
              unavailableLabel={t("common.unavailable")}
            />
            <MetricCard
              title={t("queues.total")}
              value={statsCapabilities.canShowQueueTotals ? (vm?.messagesTotal ?? 0) : null}
              icon={<Send aria-hidden="true" />}
              isUnavailable={!statsCapabilities.canShowQueueTotals}
              unavailableLabel={t("common.unavailable")}
            />
          </div>
        </SectionCard>

        {(!statsCapabilities.canShowRates || msgRateSeries.length > 0) && (
          <SectionCard title={t("queues.messageRates")}>
            <RateChart
              title={t("queues.messageRates")}
              unit="msg/s"
              series={msgRateSeries}
              selectedRange={range}
              onRangeChange={setRange}
              isAvailable={statsCapabilities.canShowRates}
              availabilityReason={statsCapabilities.availabilityReason}
            />
          </SectionCard>
        )}
      </div>

      {(!statsCapabilities.canShowQueueTotals || msgCountSeries.length > 0) && (
        <section className="space-y-3" aria-label={t("queues.messageCountChart")}>
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

      <MessageInspector
        vhost={vhost}
        name={name}
        tracingAvailable={canUseTracing}
        onOpenTracing={() => navigate({ to: "/extensions/tracing" })}
      />

      {queue?.members?.length ? (
        <SectionCard title={t("queues.replication")}>
          <QueueReplicationState leader={queue.leader} members={queue.members} online={queue.online ?? []} />
        </SectionCard>
      ) : null}

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

      <BindingList vhost={vhost} resourceName={name} mode="to-queue" />
    </div>
  );
}
