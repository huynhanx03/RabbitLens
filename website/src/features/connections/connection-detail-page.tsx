import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import type { SortingState } from "@tanstack/react-table";

import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { DetailGrid } from "@/components/shared/detail-grid";
import { SectionCard } from "@/components/shared/section-card";
import { DataTable } from "@/components/shared/data-table";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { RateChart, type RateChartSeries } from "@/components/shared/rate-chart";
import { MetricCard } from "@/components/shared/metric-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { AsyncState } from "@/components/shared/async-state";
import { StatusBadge } from "@/components/shared/status-badge";

import {
  connectionDetailQueryOptions,
  connectionKeys,
  useCloseConnectionMutation,
} from "@/domains/connections/connection-query";
import { createConnectionViewModel } from "@/domains/connections/connection-view-model";

import { getConnectionChannels } from "@/domains/channels/channel-api";
import { getConnectionSessions } from "@/domains/connections/connection-api";
import { channelKeys } from "@/domains/channels/channel-query";
import { createChannelViewModel, type ChannelViewModel } from "@/domains/channels/channel-view-model";
import { createChannelColumns } from "@/features/channels/channel-columns";

import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { CHART_RANGES, buildRangeQueryParams, CONNECTION_RANGE_PREFIXES } from "@/config/chart-ranges";
import type { ResourceListSearch } from "@/api/pagination-schema";
import { ArrowRight, ChevronLeft, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Route } from "@/app/routes/_authenticated/connections/$name";
import { AmqpSessionList } from "./amqp-session-list";

type ConnectionDetailPageProps = {
  name: string;
  channelsSearch: ResourceListSearch;
};

import { overviewQueryOptions } from "@/domains/overview/overview-query";
import { resolveStatisticsMode, getStatisticsSelectors } from "@/api/statistics-capabilities";

function clientCapabilities(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }
  return Object.entries(value).map(([key, item]) => ({
    label: key,
    value: clientPropertyText(item),
    monospace: true,
  }));
}

function clientPropertyText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return JSON.stringify(value);
}

export function ConnectionDetailPage({ name, channelsSearch }: ConnectionDetailPageProps) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const navigate = useNavigate({ from: Route.fullPath });
  const [range, setRange] = useState(CHART_RANGES[0]);

  // Global stats capabilities
  const overviewQuery = useQuery(
    overviewQueryOptions(context.apiClient, () => true),
  );
  const statsMode = resolveStatisticsMode(overviewQuery.data);
  const statsCapabilities = getStatisticsSelectors(statsMode);

  // Query: Connection detail
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const closeConnection = useCloseConnectionMutation(context.apiClient);

  const connectionQuery = useQuery(
    connectionDetailQueryOptions(
      context.apiClient,
      name,
      [range, statsCapabilities.canShowRates],
      statsCapabilities.canShowRates
        ? buildRangeQueryParams(range, CONNECTION_RANGE_PREFIXES)
        : undefined,
    ),
  );
  const connection = connectionQuery.data;
  const isAmqp10 = connection?.protocol === "AMQP 1-0" || connection?.protocol === "Web AMQP 1-0";
  // Query: Child channels
  const { data: channelsData, isLoading: isLoadingChannels } = useQuery({
    queryKey: channelKeys.connectionChannels(name, channelsSearch),
    queryFn: ({ signal }) =>
      getConnectionChannels(context.apiClient, name, channelsSearch, signal),
    enabled: Boolean(connection && !isAmqp10),
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs),
  });
  const sessionsQuery = useQuery({
    queryKey: connectionKeys.children(name, connection?.protocol ?? "AMQP 1-0"),
    queryFn: ({ signal }) => getConnectionSessions(context.apiClient, name, signal),
    enabled: Boolean(connection && isAmqp10),
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.nodeDetailsMs),
  });

  const vm = connection ? createConnectionViewModel(connection) : null;
  const channelColumns = useMemo(() => createChannelColumns(t), [t]);
  
  // Conditionally process channelsData as it could be PaginatedResponse or an array mapped to it
  const channelRows = useMemo<ChannelViewModel[]>(
    () => channelsData?.items.map(createChannelViewModel) ?? [],
    [channelsData],
  );

  const updateSearch = (updates: Partial<ResourceListSearch>) => {
    navigate({ search: (previous) => ({ ...previous, ...updates }) });
  };

  const sorting: SortingState = channelsSearch.sort
    ? [{ id: channelsSearch.sort, desc: channelsSearch.sortReverse }]
    : [];

  const rateSeries = useMemo<RateChartSeries[]>(() => {
    if (!connection?.send_oct_details?.samples && !connection?.recv_oct_details?.samples) {
      return [];
    }
    const series: RateChartSeries[] = [];
    if (connection.send_oct_details?.samples) {
      series.push({
        name: t("connections.sendRate"),
        data: connection.send_oct_details.samples.map(s => [s.timestamp, s.sample])
      });
    }
    if (connection.recv_oct_details?.samples) {
      series.push({
        name: t("connections.recvRate"),
        data: connection.recv_oct_details.samples.map(s => [s.timestamp, s.sample])
      });
    }
    return series;
  }, [connection, t]);

  return (
    <div className="space-y-6">
      <DetailPageHeader
        backAction={
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate({ to: "/connections", search: channelsSearch })}
            aria-label={t("common.back")}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
        }
        title={name}
        description={t("connections.detailDescription")}
        status={
          vm ? (
            <StatusBadge
              variant={vm.state === "running" ? "success" : vm.state === "closed" ? "error" : "warning"}
            >
              {vm.state}
            </StatusBadge>
          ) : null
        }
        metadata={vm ? [vm.user, vm.vhost, vm.protocol] : []}
        actions={
          <Button variant="destructive" onClick={() => setCloseDialogOpen(true)}>
            {t("connections.forceClose")}
          </Button>
        }
      />

      <ConfirmDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        title={t("connections.closeTitle")}
        description={t("connections.closeDescription", { name })}
        confirmText={t("connections.forceClose")}
        onConfirm={() => {
          closeConnection.mutate({ name }, {
            onSuccess: () => {
              setCloseDialogOpen(false);
              navigate({ to: "/connections", search: channelsSearch });
            }
          });
        }}
        isConfirming={closeConnection.isPending}
        error={closeConnection.error}
        variant="destructive"
      />

      <MutationErrorAlert error={closeConnection.error} />

      <AsyncState
        error={connectionQuery.error}
        isError={connectionQuery.isError}
        isFetching={!connectionQuery.isPending && connectionQuery.isFetching}
        isPending={connectionQuery.isPending}
        onRetry={() => connectionQuery.refetch()}
        notFoundAction={
          <Button variant="outline" onClick={() => navigate({ to: "/connections", search: channelsSearch })}>
            {t("common.returnToList")}
          </Button>
        }
      >
      <div className="grid gap-6 md:grid-cols-2">
        <MetricCard
          title={t("connections.sendRate")}
          value={vm?.sendRate ?? null}
          unit="bytes/s"
          icon={<Radio aria-hidden="true" />}
          isUnavailable={!statsCapabilities.canShowRates}
          unavailableLabel={t("common.unavailable")}
          className="min-h-28"
          contentClassName="pt-4"
        />
        <MetricCard
          title={t("connections.recvRate")}
          value={vm?.recvRate ?? null}
          unit="bytes/s"
          icon={<Radio aria-hidden="true" />}
          isUnavailable={!statsCapabilities.canShowRates}
          unavailableLabel={t("common.unavailable")}
          className="min-h-28"
          contentClassName="pt-4"
        />
      </div>

      <div className="mt-8">
        <SectionCard title={t("connections.properties")}>
          <div className="space-y-6">
          <div className="grid gap-4 rounded-2xl border border-border/60 bg-background/35 p-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("connections.peerEndpoint")}
              </p>
              <p className="mt-1 break-words font-mono text-sm font-medium">
                {vm?.peerEndpoint || t("common.unavailable")}
              </p>
            </div>
            <span className="hidden size-10 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary md:flex">
              <ArrowRight aria-hidden="true" className="size-4" />
            </span>
            <div className="md:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("connections.localEndpoint")}
              </p>
              <p className="mt-1 break-words font-mono text-sm font-medium">
                {vm?.endpoint || t("common.unavailable")}
              </p>
            </div>
          </div>

          <DetailGrid
            unavailableLabel={t("common.unavailable")}
            className="lg:grid-cols-3"
            items={[
              { label: t("connections.node"), value: vm?.node, monospace: true },
              { label: t("connections.connectedAt"), value: vm?.connectedAt?.toLocaleString() },
              { label: t("connections.connectionType"), value: connection?.type },
              { label: t("connections.authMechanism"), value: connection?.auth_mechanism },
              { label: t("connections.frameMax"), value: connection?.frame_max },
              { label: t("connections.channelMax"), value: connection?.channel_max },
              { label: t("connections.ssl"), value: vm?.ssl ? "TLS" : null },
              ...(connection?.ssl
                ? [
                    { label: t("connections.tlsProtocol"), value: connection.ssl_protocol },
                    { label: t("connections.tlsCipher"), value: connection.ssl_cipher },
                    { label: t("connections.tlsHash"), value: connection.ssl_hash },
                  ]
                : []),
              ...(connection?.client_properties
                ? [
                { label: "product", value: clientPropertyText(connection.client_properties.product), monospace: true },
                { label: "platform", value: clientPropertyText(connection.client_properties.platform), monospace: true },
                { label: "version", value: clientPropertyText(connection.client_properties.version), monospace: true },
                ...clientCapabilities(connection.client_properties.capabilities),
                { label: "connection_name", value: clientPropertyText(connection.client_properties.connection_name), monospace: true },
                  ]
                : []),
            ]}
          />
          </div>
        </SectionCard>
      </div>

      {(!statsCapabilities.canShowRates || rateSeries.length > 0) && (
        <div className="mt-8 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <RateChart
            title={t("connections.dataRates")}
            unit=""
            series={rateSeries}
            selectedRange={range}
            onRangeChange={setRange}
            isAvailable={statsCapabilities.canShowRates}
            availabilityReason={statsCapabilities.availabilityReason}
            showDataTable={false}
            chartClassName="h-72"
          />
        </div>
      )}

      {isAmqp10 ? (
        <AsyncState
          error={sessionsQuery.error}
          isError={sessionsQuery.isError}
          isPending={sessionsQuery.isPending}
          onRetry={() => void sessionsQuery.refetch()}
        >
          <AmqpSessionList sessions={sessionsQuery.data ?? []} />
        </AsyncState>
      ) : (
        <section className="mt-8 space-y-5">
          <h2 className="px-1 text-lg font-semibold tracking-tight">
            {t("channels.title")}
          </h2>
          <div className="space-y-5">
          <DataTable
            ariaLabel={t("connections.channelTableLabel")}
            columns={channelColumns}
            data={channelRows}
            isLoading={isLoadingChannels}
            sorting={sorting}
            columnVisibility={{
              publishRate: statsCapabilities.canShowRates,
              deliverRate: statsCapabilities.canShowRates,
              ackRate: statsCapabilities.canShowRates,
            }}
            onSortingChange={(next) => {
              const col = next[0];
              if (col) {
                updateSearch({ sort: col.id, sortReverse: col.desc, page: 1 });
              } else {
                updateSearch({ sort: undefined, sortReverse: false });
              }
            }}
            onRowClick={(row) =>
              navigate({
                to: "/channels/$name",
                params: { name: row.name },
                search: channelsSearch,
              })
            }
            getRowId={(row) => row.name}
          />
          {channelsData && (
            <PaginationControls
              page={channelsData.page}
              pageCount={channelsData.page_count}
              pageSize={channelsData.page_size}
              filteredCount={channelsData.filtered_count}
              totalCount={channelsData.total_count}
              onPageChange={(page) => updateSearch({ page })}
              onPageSizeChange={(pageSize) => updateSearch({ pageSize, page: 1 })}
            />
          )}
          </div>
        </section>
      )}
      </AsyncState>
    </div>
  );
}
