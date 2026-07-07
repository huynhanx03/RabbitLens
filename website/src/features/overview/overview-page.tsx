import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Activity,
  Box,
  Cable,
  CircleDot,
  Inbox,
  Layers3,
  Network,
  Radio,
  Server,
  Users,
} from "lucide-react";
import { AsyncState } from "@/components/shared/async-state";
import { DetailGrid } from "@/components/shared/detail-grid";
import { MetricCard } from "@/components/shared/metric-card";
import { SectionCard } from "@/components/shared/section-card";
import { StatisticsAvailability } from "@/components/shared/statistics-availability";
import { StatusBadge } from "@/components/shared/status-badge";
import { nodesListQueryOptions } from "@/domains/nodes/nodes-query";
import { overviewQueryOptions } from "@/domains/overview/overview-query";
import { createOverviewViewModel } from "@/domains/overview/overview-view-model";

function canSeeNodes(tags: readonly string[] | undefined): boolean {
  return (
    tags?.includes("administrator") === true ||
    tags?.includes("monitoring") === true
  );
}

export function OverviewPage() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const showNodeHealth = canSeeNodes(context.auth?.user?.tags);
  const overviewQuery = useQuery(
    overviewQueryOptions(context.apiClient, () => true),
  );
  const nodesQuery = useQuery({
    ...nodesListQueryOptions(context.apiClient, () => showNodeHealth),
    enabled: showNodeHealth,
  });
  const viewModel = useMemo(
    () =>
      overviewQuery.data
        ? createOverviewViewModel(overviewQuery.data, nodesQuery.data ?? [])
        : null,
    [nodesQuery.data, overviewQuery.data],
  );
  const isPending =
    overviewQuery.isPending || (showNodeHealth && nodesQuery.isPending);
  const isError = overviewQuery.isError || (showNodeHealth && nodesQuery.isError);
  const error = overviewQuery.error ?? nodesQuery.error;
  const hasNodeIssue = Boolean(
    viewModel &&
      (viewModel.nodeHealth.stopped > 0 || viewModel.nodeHealth.alarmed > 0),
  );
  const statisticsLimited = Boolean(
    viewModel &&
      viewModel.statisticsCapabilities.mode !== "basic-rates" &&
      viewModel.statisticsCapabilities.mode !== "detailed-rates",
  );
  const canShowObjectTotals = Boolean(
    viewModel &&
      viewModel.statisticsCapabilities.mode !== "disabled" &&
      viewModel.statisticsCapabilities.mode !== "queue-totals-only",
  );

  return (
    <div className="space-y-6">
      <AsyncState
        error={error}
        isError={isError}
        isFetching={
          !isPending && (overviewQuery.isFetching || nodesQuery.isFetching)
        }
        isPending={isPending}
        onRetry={() => {
          void overviewQuery.refetch();
          if (showNodeHealth) void nodesQuery.refetch();
        }}
      >
        {viewModel ? (
          <div className="space-y-6">
            <SectionCard
              title={t("overview.clusterHealth")}
              description={t("overview.clusterHealthDescription")}
              action={
                <StatusBadge variant={hasNodeIssue ? "warning" : "success"}>
                  {hasNodeIssue
                    ? t("overview.attentionRequired")
                    : t("overview.operational")}
                </StatusBadge>
              }
            >
              <DetailGrid
                className="xl:grid-cols-4"
                items={[
                  { label: t("overview.rabbitmqVersion"), value: viewModel.rabbitmqVersion },
                  { label: t("overview.managementVersion"), value: viewModel.managementVersion },
                  { label: t("overview.nodes"), value: viewModel.totals.nodes },
                ]}
              />
            </SectionCard>

            {statisticsLimited ? (
              <StatisticsAvailability
                reason={viewModel.statisticsCapabilities.availabilityReason}
              />
            ) : null}

            <section aria-labelledby="overview-object-totals">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <h2 id="overview-object-totals" className="text-lg font-semibold">
                    {t("overview.objectTotals")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("overview.objectTotalsDescription")}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                <MetricCard title={t("overview.connections")} value={viewModel.totals.connections} icon={<Cable aria-hidden="true" />} isUnavailable={!canShowObjectTotals} unavailableLabel={t("common.unavailable")} />
                <MetricCard title={t("overview.channels")} value={viewModel.totals.channels} icon={<Radio aria-hidden="true" />} isUnavailable={!canShowObjectTotals} unavailableLabel={t("common.unavailable")} />
                <MetricCard title={t("overview.exchanges")} value={viewModel.totals.exchanges} icon={<Network aria-hidden="true" />} isUnavailable={!canShowObjectTotals} unavailableLabel={t("common.unavailable")} />
                <MetricCard title={t("overview.queues")} value={viewModel.totals.queues} icon={<Layers3 aria-hidden="true" />} isUnavailable={!canShowObjectTotals} unavailableLabel={t("common.unavailable")} />
                <MetricCard title={t("overview.consumers")} value={viewModel.totals.consumers} icon={<Users aria-hidden="true" />} isUnavailable={!canShowObjectTotals} unavailableLabel={t("common.unavailable")} />
              </div>
            </section>

            <section
              aria-labelledby="overview-workload-health-title"
              className="space-y-3"
            >
              <div>
                <h2
                  id="overview-workload-health-title"
                  className="text-lg font-semibold"
                >
                  {showNodeHealth
                    ? t("overview.workloadHealth")
                    : t("overview.messageTotals")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {showNodeHealth
                    ? t("overview.workloadHealthDescription")
                    : t("overview.messageTotalsDescription")}
                </p>
              </div>
              <div
                data-testid="overview-workload-health-grid"
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
              >
                <MetricCard title={t("overview.messagesReady")} value={viewModel.totals.messagesReady} icon={<Inbox aria-hidden="true" />} status={(viewModel.totals.messagesReady ?? 0) > 0 ? "warning" : "normal"} statusLabel={(viewModel.totals.messagesReady ?? 0) > 0 ? t("overview.backlogPresent") : t("overview.noBacklog")} isUnavailable={!viewModel.statisticsCapabilities.canShowQueueTotals} unavailableLabel={t("common.unavailable")} />
                <MetricCard title={t("overview.messagesUnacked")} value={viewModel.totals.messagesUnacked} icon={<Activity aria-hidden="true" />} status={(viewModel.totals.messagesUnacked ?? 0) > 0 ? "warning" : "normal"} statusLabel={(viewModel.totals.messagesUnacked ?? 0) > 0 ? t("overview.unackedPresent") : t("overview.noUnacked")} isUnavailable={!viewModel.statisticsCapabilities.canShowQueueTotals} unavailableLabel={t("common.unavailable")} />
                <MetricCard title={t("overview.messagesTotal")} value={viewModel.totals.messagesTotal} icon={<Box aria-hidden="true" />} isUnavailable={!viewModel.statisticsCapabilities.canShowQueueTotals} unavailableLabel={t("common.unavailable")} />
                {showNodeHealth ? (
                  <>
                    <MetricCard title={t("overview.runningNodes")} value={viewModel.nodeHealth.running} icon={<Server aria-hidden="true" />} />
                    <MetricCard title={t("overview.stoppedNodes")} value={viewModel.nodeHealth.stopped} icon={<CircleDot aria-hidden="true" />} status={viewModel.nodeHealth.stopped > 0 ? "critical" : "normal"} statusLabel={viewModel.nodeHealth.stopped > 0 ? t("overview.attentionRequired") : t("overview.operational")} />
                    <MetricCard title={t("overview.alarmedNodes")} value={viewModel.nodeHealth.alarmed} icon={<Activity aria-hidden="true" />} status={viewModel.nodeHealth.alarmed > 0 ? "warning" : "normal"} statusLabel={viewModel.nodeHealth.alarmed > 0 ? t("overview.attentionRequired") : t("overview.operational")} />
                  </>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}
      </AsyncState>
    </div>
  );
}
