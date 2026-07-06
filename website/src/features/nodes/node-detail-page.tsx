import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useRouteContext } from "@tanstack/react-router";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AsyncState } from "@/components/shared/async-state";
import { DefinitionList } from "@/components/shared/definition-list";
import { MetricCard } from "@/components/shared/metric-card";
import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createNodeViewModel, type NodeStatus } from "./node-view-model";
import {
  nodeBinaryQueryOptions,
  nodeDetailQueryOptions,
} from "@/domains/nodes/nodes-query";
import { overviewQueryOptions } from "@/domains/overview/overview-query";
import { resolveStatisticsMode, getStatisticsSelectors } from "@/api/statistics-capabilities";
import { StatisticsAvailability } from "@/components/shared/statistics-availability";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useResetNodeStatisticsMutation } from "@/domains/admin/cluster/cluster-query";
import { NodeOperationalDiagnostics } from "./node-operational-diagnostics";

const BYTES_PER_KIBIBYTE = 1024;

function formatBytes(value: number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let amount = value;
  let unitIndex = 0;
  while (amount >= BYTES_PER_KIBIBYTE && unitIndex < units.length - 1) {
    amount /= BYTES_PER_KIBIBYTE;
    unitIndex += 1;
  }

  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(amount)} ${units[unitIndex]}`;
}

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <SectionCard title={title}>{children}</SectionCard>
  );
}

function statusPresentation(status: NodeStatus, t: (key: string) => string) {
  switch (status) {
    case "healthy":
      return { label: t("nodes.healthy"), variant: "success" as const };
    case "stopped":
      return { label: t("nodes.stopped"), variant: "error" as const };
    case "partitioned":
      return { label: t("nodes.partitioned"), variant: "error" as const };
    case "alarm":
      return { label: t("nodes.alarm"), variant: "warning" as const };
  }
}

function renderUnknown(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return (
    <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function NodeDetailPage() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const { name } = useParams({ strict: false }) as { name: string };
  const [showBinaryWarning, setShowBinaryWarning] = useState(false);
  const [binaryEnabled, setBinaryEnabled] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const canResetStatistics =
    context.auth?.user?.tags.includes("administrator") ?? false;
  const resetStatistics = useResetNodeStatisticsMutation(
    context.apiClient,
    name,
  );
  
  const overviewQuery = useQuery(
    overviewQueryOptions(context.apiClient, () => true),
  );
  const statsMode = resolveStatisticsMode(overviewQuery.data);
  const statsCapabilities = getStatisticsSelectors(statsMode);
  
  const nodeQuery = useQuery(
    nodeDetailQueryOptions(context.apiClient, name, () => true),
  );
  const binaryQuery = useQuery(
    nodeBinaryQueryOptions(context.apiClient, name, binaryEnabled),
  );
  const node = useMemo(
    () => (nodeQuery.data ? createNodeViewModel(nodeQuery.data) : null),
    [nodeQuery.data],
  );
  const status = node
    ? statusPresentation(node.status, (key) => t(key as never))
    : null;

  return (
    <div className="space-y-6">
      <DetailPageHeader
        backAction={
          <Link
            to="/nodes"
            aria-label={t("common.back")}
            className="inline-flex size-8 items-center justify-center rounded-lg border bg-background text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Link>
        }
        title={name}
        description={node ? t("nodes.nodeType", { type: node.type ?? t("common.unknown") }) : t("nodes.details")}
        status={node && status ? <StatusBadge variant={status.variant}>{status.label}</StatusBadge> : null}
        metadata={node ? [node.os_pid ? `PID ${node.os_pid}` : null, node.rates_mode].filter(Boolean) : []}
        actions={
          canResetStatistics ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw aria-hidden="true" />
              {t("cluster.resetNodeStatistics")}
            </Button>
          ) : null
        }
      />

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={t("cluster.resetNodeStatistics")}
        description={t("cluster.resetNodeStatisticsWarning", { node: name })}
        confirmText={t("cluster.resetNodeStatistics")}
        variant="destructive"
        isConfirming={resetStatistics.isPending}
        error={resetStatistics.error}
        onConfirm={() =>
          resetStatistics.mutate(undefined, {
            onSuccess: () => setResetOpen(false),
          })
        }
      />

      <AsyncState
        error={nodeQuery.error}
        isError={nodeQuery.isError}
        isFetching={!nodeQuery.isPending && nodeQuery.isFetching}
        isPending={nodeQuery.isPending}
        onRetry={() => void nodeQuery.refetch()}
        notFoundAction={
          <Link to="/nodes" className="inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted">
            {t("common.returnToList")}
          </Link>
        }
      >
        {node ? (
          <div className="space-y-6">
            {statsCapabilities.mode !== "basic-rates" && statsCapabilities.mode !== "detailed-rates" ? (
              <StatisticsAvailability reason={statsCapabilities.availabilityReason} />
            ) : null}

            <Section title={t("nodes.resources")}>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  title={t("nodes.fileDescriptors")}
                  value={node.fd_used ?? null}
                  unit={node.fd_total === undefined ? undefined : `/ ${node.fd_total}`}
                  isUnavailable={statsCapabilities.mode === "disabled" || statsCapabilities.mode === "queue-totals-only"}
                  unavailableLabel={t("common.unavailable")}
                />
                <MetricCard
                  title={t("nodes.socketDescriptors")}
                  value={node.sockets_used ?? null}
                  unit={
                    node.sockets_total === undefined
                      ? undefined
                      : `/ ${node.sockets_total}`
                  }
                  isUnavailable={statsCapabilities.mode === "disabled" || statsCapabilities.mode === "queue-totals-only"}
                  unavailableLabel={t("common.unavailable")}
                />
                <MetricCard
                  title={t("nodes.memory")}
                  value={formatBytes(node.mem_used)}
                  status={node.mem_alarm ? "critical" : "normal"}
                  isUnavailable={!statsCapabilities.canShowRates}
                  unavailableLabel={t("common.unavailable")}
                />
                <MetricCard
                  title={t("nodes.disk")}
                  value={formatBytes(node.disk_free)}
                  status={node.disk_free_alarm ? "critical" : "normal"}
                  isUnavailable={!statsCapabilities.canShowRates}
                  unavailableLabel={t("common.unavailable")}
                />
              </div>
            </Section>

            <Section title={t("nodes.runtime")}>
              <DefinitionList
                unavailableLabel={t("common.unavailable")}
                items={[
                  { label: t("nodes.uptime"), value: node.uptime },
                  { label: t("nodes.processUsage"), value: node.proc_used },
                  { label: "OS PID", value: node.os_pid },
                  { label: "Rates mode", value: node.rates_mode },
                  { label: "Net tick time", value: node.net_ticktime },
                  { label: "Run queue", value: node.run_queue },
                  { label: "Processors", value: node.processors },
                ]}
              />
            </Section>

            <NodeOperationalDiagnostics node={nodeQuery.data!} />

            <Section title={t("nodes.memory")}>
              {renderUnknown(node.memory) ?? (
                <p className="text-sm text-muted-foreground">
                  {t("common.unavailable")}
                </p>
              )}
            </Section>

            <Section title={t("nodes.storage")}>
              <DefinitionList
                unavailableLabel={t("common.unavailable")}
                items={[
                  { label: t("nodes.memory"), value: formatBytes(node.mem_used) },
                  { label: t("nodes.disk"), value: formatBytes(node.disk_free) },
                ]}
              />
            </Section>

            <Section title={t("nodes.clusterLinks")}>
              {renderUnknown(node.cluster_links) ?? (
                <p className="text-sm text-muted-foreground">
                  {t("common.unavailable")}
                </p>
              )}
            </Section>

            <Section title={t("nodes.applications")}>
              {node.applications?.length ? (
                <ul className="space-y-2 text-sm">
                  {node.applications.map((application) => (
                    <li key={application.name}>
                      <span className="font-medium">{application.name}</span>
                      {application.version ? ` ${application.version}` : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t("common.unavailable")}</p>
              )}
            </Section>

            <Section title={t("nodes.plugins")}>
              {node.enabled_plugins?.length ? (
                <ul className="flex flex-wrap gap-2 text-sm">
                  {node.enabled_plugins.map((plugin) => (
                    <li key={plugin} className="rounded bg-muted px-2 py-1 font-mono">
                      {plugin}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t("common.unavailable")}</p>
              )}
            </Section>

            <Section title={t("nodes.files")}>
              <DefinitionList
                unavailableLabel={t("common.unavailable")}
                items={[
                  {
                    label: "Config",
                    value: node.config_files?.join(", "),
                  },
                  { label: "Log", value: node.log_files?.join(", ") },
                ]}
              />
            </Section>

            <Section title={t("nodes.binaryMemory")}>
              {!showBinaryWarning && !binaryEnabled ? (
                <Button type="button" onClick={() => setShowBinaryWarning(true)}>
                  {t("nodes.loadBinaryMemory")}
                </Button>
              ) : null}

              {showBinaryWarning && !binaryEnabled ? (
                <Alert>
                  <AlertTitle>{t("nodes.binaryMemory")}</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>{t("nodes.expensiveQueryWarning")}</p>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowBinaryWarning(false);
                        setBinaryEnabled(true);
                      }}
                    >
                      {t("nodes.loadDetails")}
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : null}

              {binaryEnabled ? (
                <AsyncState
                  error={binaryQuery.error}
                  isError={binaryQuery.isError}
                  isPending={binaryQuery.isPending}
                  onRetry={() => void binaryQuery.refetch()}
                >
                  {renderUnknown(binaryQuery.data?.binary) ?? (
                    <p className="text-sm text-muted-foreground">
                      {t("nodes.binaryEmpty")}
                    </p>
                  )}
                </AsyncState>
              ) : null}
            </Section>
          </div>
        ) : null}
      </AsyncState>
    </div>
  );
}
