import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";

import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { DetailGrid } from "@/components/shared/detail-grid";
import { SectionCard } from "@/components/shared/section-card";
import { RateChart, type RateChartSeries } from "@/components/shared/rate-chart";
import { AmqpValue } from "@/components/shared/amqp-value";

import { getExchange } from "@/domains/exchanges/exchange-api";
import { exchangeKeys, useDeleteExchangeMutation } from "@/domains/exchanges/exchange-query";
import { createExchangeViewModel } from "./exchange-view-model";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { PublishMessageDialog } from "./publish-message-dialog";
import { BindingList } from "../bindings/binding-list";

import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { CHART_RANGES, buildRangeQueryParams } from "@/config/chart-ranges";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { overviewQueryOptions } from "@/domains/overview/overview-query";
import { resolveStatisticsMode, getStatisticsSelectors } from "@/api/statistics-capabilities";

type ExchangeDetailPageProps = {
  vhost: string;
  name: string;
};

export function ExchangeDetailPage({ vhost, name }: ExchangeDetailPageProps) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const navigate = useNavigate();
  const [range, setRange] = useState(CHART_RANGES[0]);

  const overviewQuery = useQuery(
    overviewQueryOptions(context.apiClient, () => true),
  );
  const statsMode = resolveStatisticsMode(overviewQuery.data);
  const statsCapabilities = getStatisticsSelectors(statsMode);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const deleteExchange = useDeleteExchangeMutation(context.apiClient);

  const { data: exchange } = useQuery({
    queryKey: [...exchangeKeys.detail(vhost, name), range, statsCapabilities.canShowRates],
    queryFn: ({ signal }) =>
      getExchange(
        context.apiClient,
        vhost,
        name,
        statsCapabilities.canShowRates ? buildRangeQueryParams(range, ["msg_rates"]) : undefined,
        signal,
      ),
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.nodeDetailsMs),
  });

  const vm = exchange ? createExchangeViewModel(exchange) : null;

  const rateSeries = useMemo<RateChartSeries[]>(() => {
    if (!exchange?.message_stats?.publish_in_details?.samples && !exchange?.message_stats?.publish_out_details?.samples) {
      return [];
    }
    const series: RateChartSeries[] = [];
    if (exchange.message_stats.publish_in_details?.samples) {
      series.push({
        name: t("exchanges.publishInRate"),
        data: exchange.message_stats.publish_in_details.samples.map(s => [s.timestamp, s.sample]),
        color: "hsl(var(--chart-1))"
      });
    }
    if (exchange.message_stats.publish_out_details?.samples) {
      series.push({
        name: t("exchanges.publishOutRate"),
        data: exchange.message_stats.publish_out_details.samples.map(s => [s.timestamp, s.sample]),
        color: "hsl(var(--chart-2))"
      });
    }
    return series;
  }, [exchange, t]);

  // Decode the URL param. RabbitMQ default exchange is empty string, which is tricky in URLs.
  // The path param for default exchange is usually "%2F" or similar in UI routing.
  const displayName = name === "" || name === "%2F" ? "(AMQP default)" : name;

  return (
    <div className="space-y-6">
      <DetailPageHeader
        backAction={
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate({
              to: "/exchanges",
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
        title={displayName}
        description={t("exchanges.detailDescription")}
        metadata={[vhost, vm?.type].filter(Boolean)}
        actions={
          <>
            <Button onClick={() => setPublishDialogOpen(true)}>{t("exchanges.publishMessage")}</Button>
            {name !== "" ? <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>{t("common.remove")}</Button> : null}
          </>
        }
      />

      <PublishMessageDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        vhost={vhost}
        name={name}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("common.remove")}
        description={t("exchanges.deleteDescription", { name: displayName })}
        onConfirm={() => {
          deleteExchange.mutate({ vhost, name }, {
            onSuccess: () => {
              setDeleteDialogOpen(false);
              navigate({
                to: "/exchanges",
                search: {
                  page: 1,
                  pageSize: PRODUCT_DEFAULTS.tables.defaultPageSize,
                  name: "",
                  useRegex: false,
                  sortReverse: false,
                },
              });
            }
          });
        }}
        isConfirming={deleteExchange.isPending}
        error={deleteExchange.error}
        variant="destructive"
      />

      <MutationErrorAlert error={deleteExchange.error} />

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title={t("exchanges.properties")}>
          <DetailGrid
            unavailableLabel={t("common.unavailable")}
            items={[
              { label: t("exchanges.type"), value: vm?.type },
              { label: t("exchanges.vhost"), value: vm?.vhost, monospace: true },
              { label: t("exchanges.features"), value: vm?.features?.join(", ") },
            ]}
          />
        </SectionCard>

        {(!statsCapabilities.canShowRates || rateSeries.length > 0) && (
          <SectionCard title={t("exchanges.messageRates")}>
            <RateChart
              title={t("exchanges.messageRates")}
              unit="msg/s"
              series={rateSeries}
              selectedRange={range}
              onRangeChange={setRange}
              isAvailable={statsCapabilities.canShowRates}
              availabilityReason={statsCapabilities.availabilityReason}
            />
          </SectionCard>
        )}
      </div>

      {exchange?.arguments && Object.keys(exchange.arguments).length > 0 && (
        <SectionCard title={t("exchanges.arguments")}>
          <div className="text-sm">
            <AmqpValue value={exchange.arguments} />
          </div>
        </SectionCard>
      )}

      {name !== "" && (
        <>
          <BindingList vhost={vhost} resourceName={name} mode="to-exchange" />
          <BindingList vhost={vhost} resourceName={name} mode="from-exchange" />
        </>
      )}
    </div>
  );
}
