import { useQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AmqpValue } from "@/components/shared/amqp-value";
import { AsyncState } from "@/components/shared/async-state";
import { DetailGrid } from "@/components/shared/detail-grid";
import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { SectionCard } from "@/components/shared/section-card";
import { processDetailQueryOptions } from "@/domains/extensions/top/top-query";
import { formatBytes } from "@/lib/utils";

type Props = { pid: string };

function ProcessLinks({ pids }: { pids?: string[] }) {
  if (!pids?.length) return <span>—</span>;
  return (
    <span className="flex flex-wrap gap-2">
      {pids.map((pid) => (
        <Link
          key={pid}
          to="/extensions/top/process/$pid"
          params={{ pid }}
          className="font-mono text-primary hover:underline"
        >
          {pid}
        </Link>
      ))}
    </span>
  );
}

export function ProcessDetailPage({ pid }: Props) {
  const { t } = useTranslation();
  const { apiClient } = useRouteContext({ from: "__root__" });
  const query = useQuery(processDetailQueryOptions(apiClient, pid));
  const process = query.data;

  return (
    <div className="space-y-4">
      <DetailPageHeader
        backAction={
          <Link
            to="/extensions/top"
            aria-label={t("common.back")}
            className="inline-flex size-8 items-center justify-center rounded-lg border"
          >
            <ChevronLeft aria-hidden="true" />
          </Link>
        }
        title={pid}
        description={t("top.processDetail")}
        metadata={[process?.name.name, process?.name.type].filter(Boolean)}
      />
      <AsyncState
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
      >
        {process ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title={t("top.processDetails")}>
              <DetailGrid
                unavailableLabel={t("common.unavailable")}
                items={[
                  { label: t("top.memory"), value: formatBytes(process.memory) },
                  { label: t("top.reductions"), value: process.reductions },
                  { label: t("top.reductionsPerSecond"), value: process.reduction_delta },
                  { label: t("top.messageQueue"), value: process.message_queue_len },
                  { label: t("top.buffer"), value: process.buffer_len },
                  { label: t("top.status"), value: process.status },
                  { label: t("top.trapExit"), value: String(process.trap_exit ?? false) },
                ]}
              />
            </SectionCard>
            <SectionCard title={t("top.relationships")}>
              <div className="space-y-5">
                <DetailGrid
                  items={[
                    { label: t("top.links"), value: <ProcessLinks pids={process.links} /> },
                    { label: t("top.monitors"), value: <ProcessLinks pids={process.monitors} /> },
                    { label: t("top.monitoredBy"), value: <ProcessLinks pids={process.monitored_by} /> },
                  ]}
                />
              </div>
            </SectionCard>
            <SectionCard title={t("top.stacktrace")}>
              <AmqpValue value={process.current_stacktrace ?? []} />
            </SectionCard>
          </div>
        ) : null}
      </AsyncState>
    </div>
  );
}
