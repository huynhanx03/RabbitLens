import { useState } from "react";
import { useRouteContext } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePermissionDecision } from "@/auth/permissions/permission-gate";
import { AsyncState } from "@/components/shared/async-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCreatePolicyMutation,
  useDeletePolicyMutation,
} from "./policy-mutations";
import { useOperatorPolicies, usePolicies } from "@/domains/admin/policies/policy-query";
import type { PolicyResponse } from "@/domains/admin/policies/policy-schema";
import { PolicyForm } from "./policy-form";

type PolicyKind = "standard" | "operator";
type PolicyTarget = { policy: PolicyResponse; kind: PolicyKind };

export function PolicyListPage() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "/_authenticated/admin/policies/" });
  const policies = usePolicies(context.apiClient);
  const operatorPolicies = useOperatorPolicies(context.apiClient);
  const createPolicy = useCreatePolicyMutation(context.apiClient, false);
  const createOperatorPolicy = useCreatePolicyMutation(context.apiClient, true);
  const deletePolicy = useDeletePolicyMutation(context.apiClient, false);
  const deleteOperatorPolicy = useDeletePolicyMutation(context.apiClient, true);
  const [filter, setFilter] = useState("");
  const [createKind, setCreateKind] = useState<PolicyKind | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PolicyTarget | null>(null);
  const canManagePolicies =
    usePermissionDecision({
      requiredAnyTag: ["administrator", "policymaker"],
    }).kind !== "deny";

  const filterRows = (rows: PolicyResponse[] | undefined) => {
    const term = filter.trim().toLocaleLowerCase();
    if (!term) return rows ?? [];
    return (rows ?? []).filter(
      ({ name, vhost }) =>
        name.toLocaleLowerCase().includes(term) ||
        vhost.toLocaleLowerCase().includes(term),
    );
  };

  const columnsFor = (kind: PolicyKind): ColumnDef<PolicyResponse>[] => [
    { accessorKey: "vhost", header: t("vhosts.name") },
    { accessorKey: "name", header: t("policies.name") },
    { accessorKey: "pattern", header: t("policies.pattern") },
    { accessorKey: "apply-to", header: t("policies.applyTo") },
    { accessorKey: "priority", header: t("policies.priority") },
    {
      accessorKey: "definition",
      header: t("policies.definition"),
      cell: ({ row }) => (
        <code className="block max-w-xs truncate text-xs">
          {JSON.stringify(row.original.definition)}
        </code>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) =>
        canManagePolicies ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget({ policy: row.original, kind })}
            aria-label={`${t("policies.deleteAction")} ${row.original.name}`}
          >
            <Trash2 aria-hidden="true" className="size-4 text-destructive" />
          </Button>
        ) : null,
    },
  ];

  const standardColumns = columnsFor("standard");
  const operatorColumns = columnsFor("operator");

  const activeCreate =
    createKind === "operator" ? createOperatorPolicy : createPolicy;
  const activeDelete =
    deleteTarget?.kind === "operator" ? deleteOperatorPolicy : deletePolicy;

  const renderTable = (
    kind: PolicyKind,
    query: typeof policies,
    columns: ColumnDef<PolicyResponse>[],
  ) => {
    const rows = filterRows(query.data);
    return (
      <div className="space-y-4">
        {canManagePolicies ? (
          <Button type="button" size="sm" onClick={() => setCreateKind(kind)}>
            {kind === "operator"
              ? t("policies.addOpPolicy")
              : t("policies.addPolicy")}
          </Button>
        ) : null}
        <AsyncState
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => query.refetch()}
          isEmpty={!query.isPending && rows.length === 0}
          emptyTitle={t("policies.empty")}
        >
          <DataTable
            ariaLabel={
              kind === "operator"
                ? t("policies.operatorPolicies")
                : t("policies.title")
            }
            columns={columns}
            data={rows}
            getRowId={(row) => `${row.vhost}:${row.name}`}
          />
        </AsyncState>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <PageToolbar
        ariaLabel={t("policies.title")}
        primary={
          <FilterBar
            name={filter}
            useRegex={false}
            onSubmit={(name) => setFilter(name)}
          />
        }
      />
      <Tabs defaultValue="standard">
        <TabsList>
          <TabsTrigger value="standard">{t("policies.title")}</TabsTrigger>
          <TabsTrigger value="operator">
            {t("policies.operatorPolicies")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="standard" className="mt-4">
          {renderTable("standard", policies, standardColumns)}
        </TabsContent>
        <TabsContent value="operator" className="mt-4">
          {renderTable("operator", operatorPolicies, operatorColumns)}
        </TabsContent>
      </Tabs>

      <Dialog
        open={createKind !== null}
        onOpenChange={(open) => !open && setCreateKind(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createKind === "operator"
                ? t("policies.addOpPolicy")
                : t("policies.addPolicy")}
            </DialogTitle>
          </DialogHeader>
          <MutationErrorAlert error={activeCreate.error} />
          <PolicyForm
            apiClient={context.apiClient}
            isLoading={activeCreate.isPending}
            onCancel={() => setCreateKind(null)}
            onSubmit={(vhost, name, body) =>
              activeCreate.mutate(
                { vhost, name, body },
                { onSuccess: () => setCreateKind(null) },
              )
            }
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("policies.deleteTitle")}
        description={
          deleteTarget?.kind === "operator"
            ? t("policies.deleteOpWarning")
            : t("policies.deleteWarning")
        }
        confirmText={t("common.delete")}
        variant="destructive"
        isConfirming={activeDelete.isPending}
        error={activeDelete.error}
        onConfirm={() => {
          if (!deleteTarget) return;
          activeDelete.mutate(
            {
              vhost: deleteTarget.policy.vhost,
              name: deleteTarget.policy.name,
            },
            { onSuccess: () => setDeleteTarget(null) },
          );
        }}
      />
    </div>
  );
}
