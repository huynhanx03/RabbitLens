import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AsyncState } from "@/components/shared/async-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { JsonParameterForm } from "@/components/shared/json-parameter-form";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { destructiveIconButtonClassName } from "@/lib/utils";
import { redactFederationUris, type FederationUpstream } from "@/domains/extensions/federation/federation-upstream-api";
import { federationUpstreamListQueryOptions, useDeleteFederationUpstream, useSaveFederationUpstream } from "@/domains/extensions/federation/federation-upstream-query";
import { useVhosts } from "@/domains/admin/vhosts/vhost-query";

const DEFAULT_VALUE = {
  uri: "amqp://remote-host",
  "prefetch-count": 1000,
  "reconnect-delay": 5,
  "ack-mode": "on-confirm",
};

export function FederationUpstreamListPage() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const upstreams = useQuery(federationUpstreamListQueryOptions(context.apiClient));
  const vhosts = useVhosts(context.apiClient);
  const save = useSaveFederationUpstream(context.apiClient);
  const remove = useDeleteFederationUpstream(context.apiClient);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FederationUpstream | null>(null);

  const columns: ColumnDef<FederationUpstream>[] = [
    { accessorKey: "vhost", header: t("vhosts.title") },
    { accessorKey: "name", header: t("common.name") },
    {
      id: "value",
      header: t("common.value"),
      cell: ({ row }) => (
        <code className="block max-w-md truncate text-xs">
          {JSON.stringify(redactFederationUris(row.original.value))}
        </code>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button asChild variant="ghost" size="icon">
            <Link
              to="/extensions/federation/upstreams/$vhost/$name"
              params={{ vhost: row.original.vhost, name: row.original.name }}
              aria-label={`${t("common.edit")} ${row.original.name}`}
            >
              <Pencil aria-hidden="true" />
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={destructiveIconButtonClassName}
            onClick={() => setDeleteTarget(row.original)}
            aria-label={`${t("common.delete")} ${row.original.name}`}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden="true" />
            {t("federation.addUpstream")}
          </Button>
      </div>
      <AsyncState
        isPending={upstreams.isPending}
        isError={upstreams.isError}
        error={upstreams.error}
        onRetry={() => upstreams.refetch()}
        isEmpty={!upstreams.isPending && upstreams.data?.length === 0}
        emptyTitle={t("federation.emptyUpstreams")}
      >
        <DataTable
          ariaLabel={t("federation.upstreams")}
          columns={columns}
          data={upstreams.data ?? []}
          getRowId={(row) => `${row.vhost}:${row.name}`}
        />
      </AsyncState>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("federation.addUpstream")}</DialogTitle>
          </DialogHeader>
          <MutationErrorAlert error={save.error} />
          <JsonParameterForm
            vhosts={vhosts.data?.map(({ name }) => name) ?? []}
            initialValue={DEFAULT_VALUE}
            isPending={save.isPending}
            onCancel={() => setCreateOpen(false)}
            onSubmit={(input) =>
              save.mutate(input, { onSuccess: () => setCreateOpen(false) })
            }
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("federation.deleteUpstream")}
        description={t("federation.deleteUpstreamConfirm", { name: deleteTarget?.name })}
        confirmText={t("common.delete")}
        variant="destructive"
        isConfirming={remove.isPending}
        error={remove.error}
        onConfirm={() => {
          if (!deleteTarget) return;
          remove.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
    </div>
  );
}
