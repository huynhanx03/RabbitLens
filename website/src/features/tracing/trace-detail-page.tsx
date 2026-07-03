import { useQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AmqpValue } from "@/components/shared/amqp-value";
import { AsyncState } from "@/components/shared/async-state";
import { DetailGrid } from "@/components/shared/detail-grid";
import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { SectionCard } from "@/components/shared/section-card";
import { traceDetailQueryOptions } from "@/domains/extensions/tracing/tracing-query";
import { formatBytes } from "@/lib/utils";

type Props = { node: string; vhost: string; name: string };

export function TraceDetailPage({ node, vhost, name }: Props) {
  const { t } = useTranslation();
  const { apiClient } = useRouteContext({ from: "__root__" });
  const query = useQuery(traceDetailQueryOptions(apiClient, node, vhost, name));
  const trace = query.data;

  return (
    <div className="space-y-4">
      <DetailPageHeader
        backAction={
          <Link
            to="/extensions/tracing"
            aria-label={t("common.back")}
            className="inline-flex size-8 items-center justify-center rounded-lg border"
          >
            <ChevronLeft aria-hidden="true" />
          </Link>
        }
        title={name}
        description={t("tracing.traceDetail")}
        metadata={[node, vhost]}
      />
      <AsyncState
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
      >
        {trace ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title={t("tracing.configuration")}>
              <DetailGrid
                unavailableLabel={t("common.unavailable")}
                items={[
                  { label: t("tracing.pattern"), value: trace.pattern, monospace: true },
                  { label: t("tracing.format"), value: trace.format },
                  {
                    label: t("tracing.maxPayloadBytes"),
                    value: trace.max_payload_bytes === undefined
                      ? t("tracing.unlimited")
                      : formatBytes(trace.max_payload_bytes),
                  },
                  { label: t("tracing.username"), value: trace.tracer_connection_username },
                ]}
              />
            </SectionCard>
            <SectionCard title={t("tracing.queueState")}>
              <AmqpValue value={trace.queue ?? {}} />
            </SectionCard>
          </div>
        ) : null}
      </AsyncState>
    </div>
  );
}
