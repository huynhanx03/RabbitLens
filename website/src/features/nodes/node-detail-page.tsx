import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useRouteContext } from "@tanstack/react-router";
import {
  Activity,
  Boxes,
  ChevronLeft,
  FileText,
  HardDrive,
  MemoryStick,
  Network,
  PlugZap,
  RotateCcw,
  Server,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AsyncState } from "@/components/shared/async-state";
import { DefinitionList } from "@/components/shared/definition-list";
import { MetricCard } from "@/components/shared/metric-card";
import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { DetailGrid } from "@/components/shared/detail-grid";
import { RawDataDisclosure } from "@/components/shared/raw-data-disclosure";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  StructuredKeyValue,
} from "@/components/shared/structured-key-value";
import { objectToStructuredEntries } from "@/components/shared/structured-key-value-utils";
import { UsageMeterCard } from "@/components/shared/usage-meter-card";
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

function formatUptime(ms: number | null | undefined): string | null {
  if (ms === null || ms === undefined) {
    return null;
  }

  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function applicationEntries(
  applications: Array<{ name: string; version?: string }> | undefined,
) {
  return applications?.map((application) => ({
    key: application.name,
    value: application.version ?? "—",
    monospace: true,
  })) ?? [];
}

function binaryMemoryEntries(value: unknown, limit = 12) {
  if (Array.isArray(value)) {
    return value.slice(0, limit).map((item, index) => {
      if (item && typeof item === "object" && "pid" in item) {
        const record = item as { pid?: unknown; bytes?: unknown };
        return [
          String(record.pid ?? `#${index + 1}`),
          record.bytes,
        ] as const;
      }

      return [`#${index + 1}`, item] as const;
    });
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.entries(value)
    .sort(([, left], [, right]) => {
      const leftNumber = typeof left === "number" ? left : -1;
      const rightNumber = typeof right === "number" ? right : -1;
      return rightNumber - leftNumber;
    })
    .slice(0, limit)
    .map(([key, value]) => [key, value] as const);
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
                <UsageMeterCard
                  title={t("nodes.memory")}
                  value={formatBytes(node.mem_used) ?? t("common.unavailable")}
                  limit={formatBytes(node.mem_limit)}
                  percent={node.memory.percent}
                  icon={<MemoryStick aria-hidden="true" />}
                  status={node.mem_alarm ? "critical" : "normal"}
                />
                <UsageMeterCard
                  title={t("nodes.disk")}
                  value={formatBytes(node.disk_free) ?? t("common.unavailable")}
                  limit={formatBytes(node.disk_free_limit)}
                  percent={node.disk.percent}
                  icon={<HardDrive aria-hidden="true" />}
                  status={node.disk_free_alarm ? "critical" : "normal"}
                />
                <UsageMeterCard
                  title={t("nodes.fileDescriptors")}
                  value={node.fd_used ?? t("common.unavailable")}
                  limit={node.fd_total}
                  percent={
                    node.fd_used !== undefined && node.fd_total
                      ? (node.fd_used / node.fd_total) * 100
                      : null
                  }
                  icon={<FileText aria-hidden="true" />}
                />
                <UsageMeterCard
                  title={t("nodes.socketDescriptors")}
                  value={node.sockets_used ?? t("common.unavailable")}
                  limit={node.sockets_total}
                  percent={
                    node.sockets_used !== undefined && node.sockets_total
                      ? (node.sockets_used / node.sockets_total) * 100
                      : null
                  }
                  icon={<Network aria-hidden="true" />}
                />
              </div>
            </Section>

            <SectionCard
              title={t("nodes.runtime")}
              description={t("nodes.runtimeDescription")}
            >
              <DetailGrid
                unavailableLabel={t("common.unavailable")}
                items={[
                  { label: t("nodes.uptime"), value: formatUptime(node.uptime) },
                  { label: t("nodes.processUsage"), value: node.proc_used },
                  { label: "OS PID", value: node.os_pid },
                  { label: "Rates mode", value: node.rates_mode },
                  { label: "Net tick time", value: node.net_ticktime },
                  { label: "Run queue", value: node.run_queue },
                  { label: "Processors", value: node.processors },
                ]}
              />
            </SectionCard>

            <NodeOperationalDiagnostics node={nodeQuery.data!} />

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <SectionCard
                title={t("nodes.memory")}
                description={t("nodes.memoryDescription")}
              >
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <MetricCard
                      title={t("common.used")}
                      value={formatBytes(node.mem_used)}
                      icon={<MemoryStick aria-hidden="true" />}
                    />
                    <MetricCard
                      title={t("common.limit")}
                      value={formatBytes(node.mem_limit)}
                      icon={<Server aria-hidden="true" />}
                    />
                    <MetricCard
                      title={t("common.usage")}
                      value={
                        node.memory.percent === null
                          ? null
                          : `${node.memory.percent.toFixed(1)}%`
                      }
                      status={node.mem_alarm ? "critical" : "normal"}
                      icon={<Activity aria-hidden="true" />}
                    />
                  </div>
                  {node.memory && typeof node.memory === "object" ? (
                    <StructuredKeyValue
                      entries={objectToStructuredEntries(node.memory)}
                      emptyLabel={t("common.unavailable")}
                    />
                  ) : null}
                  {node.memory ? (
                    <RawDataDisclosure title={t("nodes.rawMemoryData")} value={node.memory} />
                  ) : null}
                </div>
              </SectionCard>

              <SectionCard
                title={t("nodes.clusterLinks")}
                description={t("nodes.clusterLinksDescription")}
              >
                <div className="space-y-4">
                  <MetricCard
                    title={t("nodes.clusterLinks")}
                    value={
                      Array.isArray(node.cluster_links)
                        ? node.cluster_links.length
                        : node.cluster_links
                          ? 1
                          : 0
                    }
                    icon={<Network aria-hidden="true" />}
                  />
                  {Array.isArray(node.cluster_links) && node.cluster_links.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border/70 bg-background/30 px-3 py-4 text-sm text-muted-foreground">
                      {t("common.unavailable")}
                    </p>
                  ) : node.cluster_links ? (
                    <RawDataDisclosure title={t("nodes.rawClusterLinks")} value={node.cluster_links} />
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("common.unavailable")}</p>
                  )}
                </div>
              </SectionCard>
            </div>

            <SectionCard
              title={t("nodes.applications")}
              description={t("nodes.applicationsDescription")}
            >
              <StructuredKeyValue
                entries={applicationEntries(node.applications)}
                emptyLabel={t("common.unavailable")}
                className="md:grid-cols-2"
              />
            </SectionCard>

            <SectionCard
              title={t("nodes.plugins")}
              description={t("nodes.pluginsDescription")}
            >
              {node.enabled_plugins?.length ? (
                <ul className="flex flex-wrap gap-2 text-sm">
                  {node.enabled_plugins.map((plugin) => (
                    <li
                      key={plugin}
                      className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-mono text-xs font-medium text-primary"
                    >
                      <PlugZap aria-hidden="true" className="size-3.5" />
                      {plugin}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t("common.unavailable")}</p>
              )}
            </SectionCard>

            <SectionCard
              title={t("nodes.files")}
              description={t("nodes.filesDescription")}
            >
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
            </SectionCard>

            <SectionCard
              title={t("nodes.binaryMemory")}
              description={t("nodes.binaryMemoryDescription")}
            >
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
                  {binaryMemoryEntries(binaryQuery.data?.binary).length ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {binaryMemoryEntries(binaryQuery.data?.binary).map(([key, value]) => (
                          <MetricCard
                            key={key}
                            title={key}
                            value={typeof value === "number" ? formatBytes(value) : String(value)}
                            icon={<Boxes aria-hidden="true" />}
                          />
                        ))}
                      </div>
                      <RawDataDisclosure
                        title={t("nodes.rawBinaryMemoryData")}
                        value={binaryQuery.data?.binary}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("nodes.binaryEmpty")}
                    </p>
                  )}
                </AsyncState>
              ) : null}
            </SectionCard>
          </div>
        ) : null}
      </AsyncState>
    </div>
  );
}
