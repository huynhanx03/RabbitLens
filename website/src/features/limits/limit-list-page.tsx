import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AsyncState } from "@/components/shared/async-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  userLimitsQueryOptions,
  useClearLimitMutation,
  useSetLimitMutation,
  vhostLimitsQueryOptions,
} from "@/domains/admin/limits/limit-query";
import {
  flattenLimits,
  type LimitRow,
  type LimitScope,
} from "@/domains/admin/limits/limit-schema";
import { useUsers } from "@/domains/admin/users/user-query";
import { useVhosts } from "@/domains/admin/vhosts/vhost-query";
import { LimitForm } from "./limit-form";

export function LimitListPage() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "/_authenticated/admin/limits/" });
  const isAdministrator =
    context.auth.user?.tags.includes("administrator") ?? false;
  const [scope, setScope] = useState<LimitScope>("vhost");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [limitToClear, setLimitToClear] = useState<LimitRow | null>(null);

  const vhostLimits = useQuery(vhostLimitsQueryOptions(context.apiClient));
  const userLimits = useQuery({
    ...userLimitsQueryOptions(context.apiClient),
    enabled: isAdministrator,
  });
  const vhosts = useVhosts(context.apiClient);
  const users = useUsers(context.apiClient, isAdministrator);
  const setMutation = useSetLimitMutation(context.apiClient);
  const clearMutation = useClearLimitMutation(context.apiClient);

  const rows = useMemo(
    () =>
      scope === "vhost"
        ? flattenLimits("vhost", vhostLimits.data ?? [])
        : flattenLimits("user", userLimits.data ?? []),
    [scope, userLimits.data, vhostLimits.data],
  );
  const owners =
    scope === "vhost"
      ? (vhosts.data?.map(({ name }) => name) ?? [])
      : (users.data?.map(({ name }) => name) ?? []);
  const activeQuery = scope === "vhost" ? vhostLimits : userLimits;

  const columns = useMemo<ColumnDef<LimitRow>[]>(
    () => [
      {
        accessorKey: "owner",
        header: scope === "vhost" ? t("limits.vhost") : t("limits.user"),
      },
      { accessorKey: "name", header: t("limits.limit") },
      { accessorKey: "value", header: t("limits.value") },
      {
        id: "actions",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setLimitToClear(row.original)}
            aria-label={`${t("limits.clear")} ${row.original.name}`}
          >
            <Trash2 aria-hidden="true" className="size-4 text-destructive" />
          </Button>
        ),
      },
    ],
    [scope, t],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>{t("limits.setLimit")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("limits.setLimit")}</DialogTitle>
              </DialogHeader>
              <MutationErrorAlert error={setMutation.error} />
              <LimitForm
                scope={scope}
                owners={owners}
                isPending={setMutation.isPending}
                onCancel={() => setIsCreateOpen(false)}
                onSubmit={(input) =>
                  setMutation.mutate(input, {
                    onSuccess: () => setIsCreateOpen(false),
                  })
                }
              />
            </DialogContent>
          </Dialog>
      </div>

      <Tabs
        value={scope}
        onValueChange={(value) => setScope(value as LimitScope)}
      >
        <TabsList>
          <TabsTrigger value="vhost">{t("limits.vhostLimits")}</TabsTrigger>
          {isAdministrator ? (
            <TabsTrigger value="user">{t("limits.userLimits")}</TabsTrigger>
          ) : null}
        </TabsList>
        <TabsContent value={scope} className="mt-4">
          <AsyncState
            isPending={activeQuery.isPending}
            isError={activeQuery.isError}
            error={activeQuery.error}
            onRetry={() => activeQuery.refetch()}
            isEmpty={!activeQuery.isPending && rows.length === 0}
            emptyTitle={t("limits.empty")}
          >
            <DataTable
              ariaLabel={
                scope === "vhost"
                  ? t("limits.vhostLimits")
                  : t("limits.userLimits")
              }
              columns={columns}
              data={rows}
              getRowId={(row) => `${row.scope}:${row.owner}:${row.name}`}
            />
          </AsyncState>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={Boolean(limitToClear)}
        onOpenChange={(open) => !open && setLimitToClear(null)}
        title={t("limits.clearTitle")}
        description={t("limits.clearWarning", {
          name: limitToClear?.name,
          owner: limitToClear?.owner,
        })}
        confirmText={t("limits.clear")}
        variant="destructive"
        isConfirming={clearMutation.isPending}
        error={clearMutation.error}
        onConfirm={() => {
          if (!limitToClear) return;
          clearMutation.mutate(limitToClear, {
            onSuccess: () => setLimitToClear(null),
          });
        }}
      />
    </div>
  );
}
