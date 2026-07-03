import { useQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AmqpValue } from "@/components/shared/amqp-value";
import { AsyncState } from "@/components/shared/async-state";
import { DetailGrid } from "@/components/shared/detail-grid";
import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { streamConnectionDetailQueryOptions, streamConsumerQueryOptions, streamPublisherQueryOptions } from "@/domains/extensions/streams/stream-query";

type Props = { vhost: string; name: string };

export function StreamConnectionDetailPage({ vhost, name }: Props) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const connection = useQuery(streamConnectionDetailQueryOptions(context.apiClient, vhost, name));
  const publishers = useQuery(streamPublisherQueryOptions(context.apiClient, vhost, name));
  const consumers = useQuery(streamConsumerQueryOptions(context.apiClient, vhost, name));

  return (
    <div className="space-y-4">
      <DetailPageHeader
        backAction={
          <Link to="/extensions/streams/connections" search={{ page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false }} aria-label={t("common.back")} className="inline-flex size-8 items-center justify-center rounded-lg border">
            <ChevronLeft aria-hidden="true" />
          </Link>
        }
        title={name}
        description={t("streams.connectionDetail")}
        status={connection.data?.state ? <StatusBadge variant={connection.data.state === "running" ? "success" : "warning"}>{connection.data.state}</StatusBadge> : null}
        metadata={[vhost, connection.data?.user, connection.data?.protocol].filter(Boolean)}
      />
      <AsyncState
        isPending={connection.isPending}
        isError={connection.isError}
        error={connection.error}
        onRetry={() => connection.refetch()}
      >
        {connection.data ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title={t("connections.properties")}>
              <DetailGrid unavailableLabel={t("common.unavailable")} items={[
                { label: t("connections.node"), value: connection.data.node },
                { label: t("connections.user"), value: connection.data.user },
                { label: t("connections.protocol"), value: connection.data.protocol },
                { label: t("connections.state"), value: connection.data.state },
                { label: t("connections.ssl"), value: connection.data.ssl ? "TLS" : null },
                { label: t("streams.connectedAt"), value: connection.data.connected_at },
              ]} />
            </SectionCard>
            <SectionCard title={t("streams.clientProperties")}>
              <AmqpValue value={connection.data.client_properties ?? {}} />
            </SectionCard>
          </div>
        ) : null}
      </AsyncState>
      <SectionCard title={t("streams.publishers")}>
        <AsyncState isPending={publishers.isPending} isError={publishers.isError} error={publishers.error} onRetry={() => publishers.refetch()}>
          <AmqpValue value={publishers.data ?? []} />
        </AsyncState>
      </SectionCard>
      <SectionCard title={t("streams.consumers")}>
        <AsyncState isPending={consumers.isPending} isError={consumers.isError} error={consumers.error} onRetry={() => consumers.refetch()}>
          <AmqpValue value={consumers.data ?? []} />
        </AsyncState>
      </SectionCard>
    </div>
  );
}
