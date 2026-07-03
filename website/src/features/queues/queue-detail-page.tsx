import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";

import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { DetailGrid } from "@/components/shared/detail-grid";
import { SectionCard } from "@/components/shared/section-card";
import { RateChart, type RateChartSeries } from "@/components/shared/rate-chart";
import { AmqpValue } from "@/components/shared/amqp-value";
import { StatusBadge } from "@/components/shared/status-badge";

import { getQueue } from "@/domains/queues/queue-api";
import { queueKeys, usePurgeQueueMutation } from "@/domains/queues/queue-query";
import { createQueueViewModel } from "./queue-view-model";
import { DeleteQueueDialog } from "./delete-queue-dialog";
import { GetMessagesDialog } from "./get-messages-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { BindingList } from "../bindings/binding-list";

import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { CHART_RANGES, buildRangeQueryParams, QUEUE_RANGE_PREFIXES } from "@/config/chart-ranges";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { overviewQueryOptions } from "@/domains/overview/overview-query";
import { resolveStatisticsMode, getStatisticsSelectors } from "@/api/statistics-capabilities";
import { StatisticsAvailability } from "@/components/shared/statistics-availability";

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
  const [getMessagesDialogOpen, setGetMessagesDialogOpen] = useState(false);

  const overviewQuery = useQuery(
    overviewQueryOptions(context.apiClient, () => true),
  );
  const statsMode = resolveStatisticsMode(overviewQuery.data);
  const statsCapabilities = getStatisticsSelectors(statsMode);

  const purgeMutation = usePurgeQueueMutation(context.apiClient);

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

  const msgRateSeries = useMemo<RateChartSeries[]>(() => {
    if (!queue?.message_stats) return [];
    const series: RateChartSeries[] = [];
    if (queue.message_stats.publish_details?.samples) {
      series.push({
        name: t("queues.publishRate"),
        data: queue.message_stats.publish_details.samples.map((sample) => [sample.timestamp, sample.sample]),
        color: "hsl(var(--chart-1))"
      });
    }
    if (queue.message_stats.deliver_get_details?.samples) {
      series.push({
        name: t("queues.deliverRate"),
        data: queue.message_stats.deliver_get_details.samples.map((sample) => [sample.timestamp, sample.sample]),
        color: "hsl(var(--chart-2))"
      });
    }
    if (queue.message_stats.ack_details?.samples) {
      series.push({
        name: t("queues.ackRate"),
        data: queue.message_stats.ack_details.samples.map((sample) => [sample.timestamp, sample.sample]),
        color: "hsl(var(--chart-3))"
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
        data: queue.messages_details.samples.map((sample) => [sample.timestamp, sample.sample]),
        color: "hsl(var(--chart-4))"
      });
    }
    if (queue.messages_ready_details?.samples) {
      series.push({
        name: t("queues.ready"),
        data: queue.messages_ready_details.samples.map((sample) => [sample.timestamp, sample.sample]),
        color: "hsl(var(--chart-5))"
      });
    }
    if (queue.messages_unacknowledged_details?.samples) {
      series.push({
        name: t("queues.unacked"),
        data: queue.messages_unacknowledged_details.samples.map((sample) => [sample.timestamp, sample.sample]),
        color: "hsl(var(--chart-6))"
      });
    }
    return series;
  }, [queue, t]);

  const stateVariant = vm?.state === "running" ? "success" : vm?.state === "idle" ? "info" : vm?.state === "flow" ? "warning" : "error";

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
        metadata={[vhost, vm?.type, vm?.node].filter(Boolean)}
        actions={
          <>
            <Button onClick={() => setGetMessagesDialogOpen(true)}>{t("queues.getMessages")}</Button>
            <Button variant="outline" onClick={() => setPurgeDialogOpen(true)}>{t("queues.purge")}</Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>{t("common.remove")}</Button>
          </>
        }
      />

      <GetMessagesDialog
        open={getMessagesDialogOpen}
        onOpenChange={setGetMessagesDialogOpen}
        vhost={vhost}
        name={name}
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
              { label: t("queues.type"), value: vm?.type },
              { label: t("queues.vhost"), value: vm?.vhost, monospace: true },
              { label: t("queues.node"), value: vm?.node, monospace: true },
              { label: t("queues.features"), value: vm?.features?.join(", ") },
              { label: t("queues.consumers"), value: vm?.consumers ?? 0 },
            ]}
          />
        </SectionCard>

        <SectionCard title={t("queues.messageCounts")}>
          {!statsCapabilities.canShowQueueTotals ? (
            <div className="mb-4">
              <StatisticsAvailability reason={statsCapabilities.availabilityReason} />
            </div>
          ) : null}
          <dl className="grid grid-cols-3 gap-x-4 gap-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">{t("queues.ready")}</dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {statsCapabilities.canShowQueueTotals ? (vm?.messagesReady ?? 0) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("queues.unacked")}</dt>
              <dd className="text-2xl font-semibold tabular-nums text-warning">
                {statsCapabilities.canShowQueueTotals ? (vm?.messagesUnacked ?? 0) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("queues.total")}</dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {statsCapabilities.canShowQueueTotals ? (vm?.messagesTotal ?? 0) : "—"}
              </dd>
            </div>
          </dl>
        </SectionCard>

        {(!statsCapabilities.canShowQueueTotals || msgCountSeries.length > 0) && (
          <SectionCard title={t("queues.messageCountChart")}>
            <RateChart
              title={t("queues.messageCountChart")}
              unit="msgs"
              series={msgCountSeries}
              selectedRange={range}
              onRangeChange={setRange}
              isAvailable={statsCapabilities.canShowQueueTotals}
              availabilityReason={statsCapabilities.availabilityReason}
            />
          </SectionCard>
        )}

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

      {queue?.arguments && Object.keys(queue.arguments).length > 0 && (
        <SectionCard title={t("queues.arguments")}>
          <div className="text-sm">
            <AmqpValue value={queue.arguments} />
          </div>
        </SectionCard>
      )}

      <BindingList vhost={vhost} resourceName={name} mode="to-queue" />
    </div>
  );
}
