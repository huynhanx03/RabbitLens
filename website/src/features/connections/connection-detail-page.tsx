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
import { AmqpValue } from "@/components/shared/amqp-value";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { AsyncState } from "@/components/shared/async-state";
import { StatusBadge } from "@/components/shared/status-badge";

import {
  connectionDetailQueryOptions,
  useCloseConnectionMutation,
} from "@/domains/connections/connection-query";
import { createConnectionViewModel } from "@/domains/connections/connection-view-model";

import { getConnectionChannels } from "@/domains/channels/channel-api";
import { channelKeys } from "@/domains/channels/channel-query";
import { createChannelViewModel, type ChannelViewModel } from "@/domains/channels/channel-view-model";
import { createChannelColumns } from "@/features/channels/channel-columns";

import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { CHART_RANGES, buildRangeQueryParams, CONNECTION_RANGE_PREFIXES } from "@/config/chart-ranges";
import type { ResourceListSearch } from "@/api/pagination-schema";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Route } from "@/app/routes/_authenticated/connections/$name";

type ConnectionDetailPageProps = {
  name: string;
  channelsSearch: ResourceListSearch;
};

import { overviewQueryOptions } from "@/domains/overview/overview-query";
import { resolveStatisticsMode, getStatisticsSelectors } from "@/api/statistics-capabilities";

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
  // Query: Child channels
  const { data: channelsData, isLoading: isLoadingChannels } = useQuery({
    queryKey: channelKeys.connectionChannels(name, channelsSearch),
    queryFn: ({ signal }) =>
      getConnectionChannels(context.apiClient, name, channelsSearch, signal),
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs),
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
        data: connection.send_oct_details.samples.map(s => [s.timestamp, s.sample]),
        color: "hsl(var(--chart-1))"
      });
    }
    if (connection.recv_oct_details?.samples) {
      series.push({
        name: t("connections.recvRate"),
        data: connection.recv_oct_details.samples.map(s => [s.timestamp, s.sample]),
        color: "hsl(var(--chart-2))"
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

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title={t("connections.properties")}>
          <DetailGrid
            unavailableLabel={t("common.unavailable")}
            items={[
              { label: t("connections.state"), value: vm?.state },
              { label: t("connections.node"), value: vm?.node, monospace: true },
              { label: t("connections.user"), value: vm?.user },
              { label: t("connections.vhost"), value: vm?.vhost, monospace: true },
              { label: t("connections.protocol"), value: vm?.protocol },
              { label: t("connections.ssl"), value: vm?.ssl ? "TLS" : null },
            ]}
          />
        </SectionCard>

        {(!statsCapabilities.canShowRates || rateSeries.length > 0) && (
          <SectionCard title={t("connections.dataRates")}>
            <RateChart
              title={t("connections.dataRates")}
              unit="bytes/s"
              series={rateSeries}
              selectedRange={range}
              onRangeChange={setRange}
              isAvailable={statsCapabilities.canShowRates}
              availabilityReason={statsCapabilities.availabilityReason}
            />
          </SectionCard>
        )}
      </div>

      {connection?.client_properties && (
        <SectionCard title={t("connections.clientProperties")}>
          <div className="text-sm">
            <AmqpValue value={connection.client_properties} />
          </div>
        </SectionCard>
      )}

      <SectionCard title={t("channels.title")}>
        <div className="space-y-4">
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
      </SectionCard>
      </AsyncState>
    </div>
  );
}
