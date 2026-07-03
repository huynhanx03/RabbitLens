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
import { sanitizeFederationUri } from "@/domains/extensions/federation/federation-schema";
import {
  useRestartShovelMutation,
  useShovels,
} from "@/domains/extensions/shovels/shovel-query";
import type { ShovelStatusResponse } from "@/domains/extensions/shovels/shovel-schema";

function stateVariant(state: string): StatusVariant {
  if (state === "running") return "success";
  if (state === "terminated") return "error";
  if (state === "starting") return "info";
  return "unknown";
}

export function ShovelStatusPage() {
  const { t } = useTranslation();
  const { apiClient, auth } = useRouteContext({ from: "__root__" });
  const [selectedVhost, setSelectedVhost] = useState("all");
  const [shovelToRestart, setShovelToRestart] = useState<ShovelStatusResponse | null>(null);
  const vhosts = useVhosts(apiClient);
  const shovels = useShovels(apiClient, selectedVhost);
  const restart = useRestartShovelMutation(apiClient);
  const canManage = auth.user?.tags.some((tag) =>
    tag === "administrator" || tag === "policymaker",
  ) ?? false;

  const columns = useMemo<ColumnDef<ShovelStatusResponse>[]>(
    () => [
      { accessorKey: "name", header: t("shovels.name") },
      {
        accessorKey: "type",
        header: t("shovels.type"),
        cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
      },
      {
        accessorKey: "state",
        header: t("shovels.state"),
        cell: ({ row }) => (
          <StatusBadge variant={stateVariant(row.original.state)}>
            {row.original.state}
          </StatusBadge>
        ),
      },
      {
        accessorKey: "src_uri",
        header: t("shovels.source"),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{sanitizeFederationUri(row.original.src_uri)}</span>
        ),
      },
      {
        accessorKey: "dest_uri",
        header: t("shovels.destination"),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{sanitizeFederationUri(row.original.dest_uri)}</span>
        ),
      },
      { accessorKey: "vhost", header: t("shovels.vhost") },
      { accessorKey: "node", header: t("shovels.node") },
      {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => canManage ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${t("shovels.restartShovel")} ${row.original.name}`}
            onClick={() => setShovelToRestart(row.original)}
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
        ariaLabel={t("shovels.vhostFilter")}
        primary={
          <Select value={selectedVhost} onValueChange={setSelectedVhost}>
            <SelectTrigger aria-label={t("shovels.vhost")} className="min-w-56">
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
            <Link to="/extensions/shovels/management">
              {t("shovels.management")}
            </Link>
          </Button>
        ) : undefined}
      />
      <AsyncState
        isPending={shovels.isPending}
        isError={shovels.isError}
        error={shovels.error}
        onRetry={() => shovels.refetch()}
        isEmpty={!shovels.isPending && shovels.data?.length === 0}
        emptyTitle={t("shovels.emptyStatus")}
      >
        <DataTable
          ariaLabel={t("shovels.statusTitle")}
          columns={columns}
          data={shovels.data ?? []}
          getRowId={(shovel) => `${shovel.vhost}:${shovel.name}:${shovel.node}`}
        />
      </AsyncState>
      <ConfirmDialog
        open={shovelToRestart !== null}
        onOpenChange={(open) => !open && setShovelToRestart(null)}
        title={t("shovels.restartShovel")}
        description={t("shovels.restartConfirm", {
          name: shovelToRestart?.name,
          node: shovelToRestart?.node,
        })}
        confirmText={t("shovels.restart")}
        isConfirming={restart.isPending}
        error={restart.error}
        onConfirm={() => shovelToRestart && restart.mutate(
          { vhost: shovelToRestart.vhost, name: shovelToRestart.name, node: shovelToRestart.node },
          { onSuccess: () => setShovelToRestart(null) },
        )}
      />
    </div>
  );
}
