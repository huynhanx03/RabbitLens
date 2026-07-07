import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { CheckCheck, ChevronLeft, Gauge, MessagesSquare, Radio, Send, Users } from "lucide-react";
import { AsyncState } from "@/components/shared/async-state";
import { DetailGrid } from "@/components/shared/detail-grid";
import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { channelDetailQueryOptions } from "@/domains/channels/channel-query";
import { createChannelViewModel } from "@/domains/channels/channel-view-model";
import { ConsumerTable } from "@/features/consumers/consumer-table";

export function ChannelDetailPage({ name }: { name: string }) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const navigate = useNavigate();
  const query = useQuery(channelDetailQueryOptions(context.apiClient, name, "current"));
  const channel = useMemo(() => query.data ? createChannelViewModel(query.data) : null, [query.data]);

  return (
    <div className="space-y-6">
      <DetailPageHeader
        backAction={<Button variant="outline" size="icon" aria-label={t("common.back")} onClick={() => navigate({ to: "/channels", search: { page: 1, pageSize: PRODUCT_DEFAULTS.tables.defaultPageSize, name: "", useRegex: false, sortReverse: false } })}><ChevronLeft aria-hidden="true" /></Button>}
        title={name}
        description={t("channels.detailDescription")}
        status={channel ? <StatusBadge variant={channel.state === "running" ? "success" : channel.state === "idle" ? "info" : "warning"}>{channel.state}</StatusBadge> : null}
        metadata={channel ? [channel.user, channel.vhost, channel.node] : []}
      />
      <AsyncState error={query.error} isError={query.isError} isFetching={!query.isPending && query.isFetching} isPending={query.isPending} onRetry={() => query.refetch()} notFoundAction={<Button variant="outline" onClick={() => navigate({ to: "/channels", search: { page: 1, pageSize: PRODUCT_DEFAULTS.tables.defaultPageSize, name: "", useRegex: false, sortReverse: false } })}>{t("common.returnToList")}</Button>}>
        {channel ? <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard title={t("channels.consumers")} value={channel.consumerCount} icon={<Users aria-hidden="true" />} />
            <MetricCard title={t("channels.unacknowledged")} value={channel.unacknowledged} icon={<MessagesSquare aria-hidden="true" />} status={channel.unacknowledged > 0 ? "warning" : "normal"} statusLabel={channel.unacknowledged > 0 ? t("channels.unacknowledgedPresent") : t("channels.noUnacknowledged")} />
            <MetricCard title={t("channels.prefetch")} value={channel.prefetchCount} icon={<Gauge aria-hidden="true" />} />
            <MetricCard title={t("channels.publishRate")} value={channel.publishRate} unit="msg/s" icon={<Radio aria-hidden="true" />} />
            <MetricCard title={t("channels.deliverRate")} value={channel.deliverRate} unit="msg/s" icon={<Send aria-hidden="true" />} />
            <MetricCard title={t("channels.ackRate")} value={channel.ackRate} unit="msg/s" icon={<CheckCheck aria-hidden="true" />} />
          </div>
          <SectionCard title={t("channels.properties")}>
            <DetailGrid unavailableLabel={t("common.unavailable")} items={[
              { label: t("channels.user"), value: channel.user },
              { label: t("channels.vhost"), value: channel.vhost, monospace: true },
              { label: t("channels.node"), value: channel.node, monospace: true },
              { label: t("channels.number"), value: channel.number },
              { label: t("channels.transactional"), value: channel.transactional ? t("common.yes") : t("common.no") },
              { label: t("channels.confirmMode"), value: channel.confirm ? t("common.yes") : t("common.no") },
              { label: t("channels.unconfirmed"), value: channel.unconfirmed },
              { label: t("channels.uncommitted"), value: channel.uncommitted },
              { label: t("channels.globalPrefetch"), value: channel.globalPrefetchCount },
            ]} />
          </SectionCard>
          <SectionCard
            title={t("channels.messageRates")}
            description={t("channels.messageRatesDescription")}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard title={t("channels.publishRate")} value={channel.publishRate} unit="msg/s" icon={<Radio aria-hidden="true" />} />
              <MetricCard title={t("channels.deliverRate")} value={channel.deliverRate} unit="msg/s" icon={<Send aria-hidden="true" />} />
              <MetricCard title={t("channels.ackRate")} value={channel.ackRate} unit="msg/s" icon={<CheckCheck aria-hidden="true" />} />
            </div>
          </SectionCard>
          {(query.data?.pending_raft_commands != null || query.data?.cached_segments != null) ? (
            <SectionCard title={t("channels.protocolDiagnostics")}>
              <DetailGrid unavailableLabel={t("common.unavailable")} items={[
                { label: t("channels.pendingRaftCommands"), value: query.data.pending_raft_commands },
                { label: t("channels.cachedSegments"), value: query.data.cached_segments },
              ]} />
            </SectionCard>
          ) : null}
          <SectionCard title={t("queues.consumersDetail")}>
            <ConsumerTable consumers={query.data?.consumer_details ?? []} />
          </SectionCard>
        </div> : null}
      </AsyncState>
    </div>
  );
}
