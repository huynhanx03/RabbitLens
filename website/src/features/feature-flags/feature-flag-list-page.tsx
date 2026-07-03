import { useMemo, useState } from "react";
import { useRouteContext } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePermissionDecision } from "@/auth/permissions/permission-gate";
import { AsyncState } from "@/components/shared/async-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useEnableFeatureFlagMutation } from "./feature-flag-mutations";
import { useFeatureFlags } from "@/domains/admin/feature-flags/feature-flag-query";
import type { FeatureFlagResponse } from "@/domains/admin/feature-flags/feature-flag-schema";

export function FeatureFlagListPage() {
  const { t } = useTranslation();
  const context = useRouteContext({
    from: "/_authenticated/admin/feature-flags",
  });
  const featureFlags = useFeatureFlags(context.apiClient);
  const enableMutation = useEnableFeatureFlagMutation(context.apiClient);
  const [filter, setFilter] = useState("");
  const [flagToEnable, setFlagToEnable] = useState<string | null>(null);
  const canManageFlags =
    usePermissionDecision({ requiredAnyTag: ["administrator"] }).kind !==
    "deny";

  const rows = useMemo(() => {
    const term = filter.trim().toLocaleLowerCase();
    if (!term) return featureFlags.data ?? [];
    return (featureFlags.data ?? []).filter(
      (flag) =>
        flag.name.toLocaleLowerCase().includes(term) ||
        flag.desc.toLocaleLowerCase().includes(term),
    );
  }, [featureFlags.data, filter]);

  const columns = useMemo<ColumnDef<FeatureFlagResponse>[]>(
    () => [
      { accessorKey: "name", header: t("common.name") },
      { accessorKey: "desc", header: t("featureFlags.description") },
      {
        accessorKey: "state",
        header: t("featureFlags.state"),
        cell: ({ row }) => {
          const state = row.original.state;
          const variant =
            state === "enabled"
              ? "success"
              : state === "disabled"
                ? "warning"
                : "error";
          return <StatusBadge variant={variant}>{state}</StatusBadge>;
        },
      },
      {
        accessorKey: "provided_by",
        header: t("featureFlags.providedBy"),
      },
      {
        id: "actions",
        cell: ({ row }) =>
          canManageFlags && row.original.state !== "enabled" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFlagToEnable(row.original.name)}
            >
              <Play aria-hidden="true" />
              {t("featureFlags.enable")}
            </Button>
          ) : null,
      },
    ],
    [canManageFlags, t],
  );

  return (
    <div className="space-y-4">
      <PageToolbar
        ariaLabel={t("featureFlags.title")}
        primary={
          <FilterBar
            name={filter}
            useRegex={false}
            onSubmit={(name) => setFilter(name)}
          />
        }
      />
      <AsyncState
        isPending={featureFlags.isPending}
        isError={featureFlags.isError}
        error={featureFlags.error}
        onRetry={() => featureFlags.refetch()}
        isEmpty={!featureFlags.isPending && rows.length === 0}
        emptyTitle={t("featureFlags.empty")}
      >
        <DataTable
          ariaLabel={t("featureFlags.title")}
          columns={columns}
          data={rows}
          getRowId={(row) => row.name}
        />
      </AsyncState>

      <ConfirmDialog
        open={Boolean(flagToEnable)}
        onOpenChange={(open) => !open && setFlagToEnable(null)}
        title={t("featureFlags.enableTitle")}
        description={t("featureFlags.enableWarning", { name: flagToEnable })}
        confirmText={t("featureFlags.enable")}
        isConfirming={enableMutation.isPending}
        error={enableMutation.error}
        onConfirm={() => {
          if (!flagToEnable) return;
          enableMutation.mutate(flagToEnable, {
            onSuccess: () => setFlagToEnable(null),
          });
        }}
      />
    </div>
  );
}
