import { useTranslation } from "react-i18next";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { useVhosts } from "@/domains/admin/vhosts/vhost-query";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { FilterBar } from "@/components/shared/filter-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VhostForm } from "./vhost-form";
import { useCreateVhostMutation } from "./vhost-mutations";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { usePermissionDecision } from "@/auth/permissions/permission-gate";
import type { ColumnDef } from "@tanstack/react-table";
import type { VhostResponse } from "@/domains/admin/vhosts/vhost-schema";
import { AsyncState } from "@/components/shared/async-state";
import { PageToolbar } from "@/components/shared/page-toolbar";

export function VhostListPage() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "/_authenticated/admin/vhosts/" });
  const navigate = useNavigate({ from: "/admin/vhosts/" });
  const { data: vhosts, isPending, isError, error } = useVhosts(context.apiClient);
  const [filter, setFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createMutation = useCreateVhostMutation(context.apiClient);

  const canManageVhosts = usePermissionDecision({ requiredAnyTag: ["administrator"] }).kind !== "deny";

  if (isPending) return <Skeleton className="h-[400px] w-full" />;
  if (isError) return <AsyncState isError error={error} onRetry={() => undefined}><span /></AsyncState>;

  const filteredVhosts = vhosts.filter((v) => 
    v.name.toLowerCase().includes(filter.toLowerCase())
  );

  const columns: ColumnDef<VhostResponse>[] = [
    {
      accessorKey: "name",
      header: t("vhosts.name"),
      cell: ({ row }) => (
        <span className="font-medium text-primary">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "description",
      header: t("vhosts.description"),
    },
    {
      accessorKey: "tags",
      header: t("vhosts.tags"),
      cell: ({ row }) => row.original.tags?.join(", ") || "",
    },
    {
      accessorKey: "default_queue_type",
      header: t("vhosts.defaultQueueType"),
    },
    {
      id: "cluster_state",
      header: t("vhosts.clusterState"),
      cell: ({ row }) => {
        const states = row.original.cluster_state || {};
        const isRunning = Object.values(states).some((s) => s === "running");
        return <StatusBadge variant={isRunning ? "success" : "error"} >{isRunning ? "running" : "stopped"}</StatusBadge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageToolbar
        ariaLabel={t("vhosts.filter")}
        primary={
          <FilterBar
            name={filter}
            useRegex={false}
            onSubmit={(name, _) => setFilter(name)}
          />
        }
        secondary={
          canManageVhosts ? (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>{t("vhosts.addVhost")}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t("vhosts.createTitle")}</DialogTitle>
              </DialogHeader>
              <MutationErrorAlert error={createMutation.error} />
              <VhostForm 
                onSubmit={(data) => {
                  createMutation.mutate(
                    { name: data.name, body: data },
                    { onSuccess: () => setIsCreateOpen(false) }
                  );
                }} 
                isLoading={createMutation.isPending}
                onCancel={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
          ) : null
        }
      />

      <DataTable
        ariaLabel={t("vhosts.title")}
        columns={columns}
        data={filteredVhosts}
        getRowId={(vhost) => vhost.name}
        onRowClick={(vhost) =>
          navigate({
            to: "/admin/vhosts/$name",
            params: { name: vhost.name },
          })
        }
      />
    </div>
  );
}
