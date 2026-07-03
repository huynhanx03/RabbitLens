import { useMemo, useState } from "react";
import { Link, useRouteContext } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AsyncState } from "@/components/shared/async-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { StatusBadge, type StatusVariant } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVhosts } from "@/domains/admin/vhosts/vhost-query";
import {
  useFederationLinks,
  useRestartFederationLinkMutation,
} from "@/domains/extensions/federation/federation-query";
import {
  sanitizeFederationUri,
  type FederationLinkResponse,
} from "@/domains/extensions/federation/federation-schema";

function statusVariant(status: string): StatusVariant {
  if (status === "running") return "success";
  if (status === "error" || status === "shutdown") return "error";
  if (status === "starting") return "info";
  if (status === "stopped") return "warning";
  return "unknown";
}

export function FederationStatusPage() {
  const { t } = useTranslation();
  const { apiClient, auth } = useRouteContext({ from: "__root__" });
  const [selectedVhost, setSelectedVhost] = useState("all");
  const [linkToRestart, setLinkToRestart] = useState<FederationLinkResponse | null>(null);
  const vhosts = useVhosts(apiClient);
  const links = useFederationLinks(apiClient, selectedVhost);
  const restart = useRestartFederationLinkMutation(apiClient);
  const canManage = auth.user?.tags.some((tag) =>
    tag === "administrator" || tag === "policymaker",
  ) ?? false;

  const columns = useMemo<ColumnDef<FederationLinkResponse>[]>(
    () => [
      { accessorKey: "upstream", header: t("federation.upstream") },
      {
        accessorKey: "uri",
        header: t("federation.uri"),
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {sanitizeFederationUri(row.original.uri)}
          </span>
        ),
      },
      {
        id: "destination",
        header: t("federation.destination"),
        cell: ({ row }) => {
          const name = row.original.type === "exchange"
            ? row.original.exchange
            : row.original.queue;
          return (
            <span className="flex items-center gap-2">
              {name ?? "—"}
              {row.original.type ? <Badge variant="outline">{row.original.type}</Badge> : null}
            </span>
          );
        },
      },
      { accessorKey: "vhost", header: t("federation.vhost") },
      { accessorKey: "node", header: t("federation.node") },
      {
        accessorKey: "status",
        header: t("federation.status"),
        cell: ({ row }) => (
          <StatusBadge variant={statusVariant(row.original.status)}>
            {row.original.status}
          </StatusBadge>
        ),
      },
      {
        accessorKey: "error",
        header: t("federation.lastError"),
        cell: ({ row }) => row.original.error ? (
          <span className="line-clamp-2 text-sm text-destructive" title={row.original.error}>
            {row.original.error}
          </span>
        ) : "—",
      },
      {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => canManage ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${t("federation.restartLink")} ${row.original.upstream}`}
            onClick={() => setLinkToRestart(row.original)}
          >
            <RotateCcw aria-hidden="true" />
          </Button>
        ) : null,
      },
    ],
    [canManage, t],
  );

  return (
    <div className="space-y-4">
      <PageToolbar
        ariaLabel={t("federation.vhostFilter")}
        primary={
          <Select value={selectedVhost} onValueChange={setSelectedVhost}>
            <SelectTrigger aria-label={t("federation.vhost")} className="min-w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("definitions.allVhosts")}</SelectItem>
              {vhosts.data?.map(({ name }) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        secondary={canManage ? (
          <Button asChild variant="outline">
            <Link to="/extensions/federation/upstreams">
              {t("federation.upstreams")}
            </Link>
          </Button>
        ) : undefined}
      />
      <AsyncState
        isPending={links.isPending}
        isError={links.isError}
        error={links.error}
        onRetry={() => links.refetch()}
        isEmpty={!links.isPending && links.data?.length === 0}
        emptyTitle={t("federation.emptyLinks")}
      >
        <DataTable
          ariaLabel={t("federation.statusTitle")}
          columns={columns}
          data={links.data ?? []}
          getRowId={(link) => `${link.vhost}:${link.id}:${link.node}`}
        />
      </AsyncState>
      <ConfirmDialog
        open={linkToRestart !== null}
        onOpenChange={(open) => !open && setLinkToRestart(null)}
        title={t("federation.restartLink")}
        description={t("federation.restartConfirm", {
          upstream: linkToRestart?.upstream,
          node: linkToRestart?.node,
        })}
        confirmText={t("federation.restart")}
        isConfirming={restart.isPending}
        error={restart.error}
        onConfirm={() => linkToRestart && restart.mutate(
          { vhost: linkToRestart.vhost, id: linkToRestart.id, node: linkToRestart.node },
          { onSuccess: () => setLinkToRestart(null) },
        )}
      />
    </div>
  );
}
