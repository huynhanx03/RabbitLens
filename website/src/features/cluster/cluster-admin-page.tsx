import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AsyncState } from "@/components/shared/async-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clusterNameQueryOptions,
  useResetAllStatisticsMutation,
  useSetClusterNameMutation,
} from "@/domains/admin/cluster/cluster-query";
import { DefinitionAdminPage } from "@/features/definitions/definition-admin-page";

export function ClusterAdminPage() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "/_authenticated/admin/cluster" });
  const clusterName = useQuery(clusterNameQueryOptions(context.apiClient));
  const updateName = useSetClusterNameMutation(context.apiClient);
  const resetStatistics = useResetAllStatisticsMutation(context.apiClient);
  const [name, setName] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (clusterName.data) setName(clusterName.data.name);
  }, [clusterName.data]);

  return (
    <div className="space-y-4">
      <AsyncState
        isPending={clusterName.isPending}
        isError={clusterName.isError}
        error={clusterName.error}
        onRetry={() => clusterName.refetch()}
      >
        <SectionCard
          title={t("cluster.title")}
          description={`${t("cluster.nameDescription")} ${t("cluster.statisticsDescription")}`}
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)] lg:divide-x lg:divide-border/60">
            <div className="space-y-4 lg:pr-6">
              <div>
                <h3 className="text-base font-semibold">{t("cluster.name")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("cluster.nameDescription")}
                </p>
              </div>

            <MutationErrorAlert error={updateName.error} />
            <form
              className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                updateName.mutate(name.trim());
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="cluster-name">{t("cluster.name")}</Label>
                <Input
                  id="cluster-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={updateName.isPending}
                  required
                />
              </div>
              <Button
                type="submit"
                className="sm:min-w-28"
                disabled={
                  updateName.isPending ||
                  name.trim().length === 0 ||
                  name === clusterName.data?.name
                }
              >
                {updateName.isPending
                  ? t("common.loading")
                  : t("cluster.update")}
              </Button>
            </form>
            </div>

            <div className="space-y-4 lg:pl-6">
              <div>
                <h3 className="text-base font-semibold">
                  {t("cluster.statistics")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("cluster.statisticsDescription")}
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw aria-hidden="true" />
                {t("cluster.resetStatistics")}
              </Button>
            </div>
          </div>
        </SectionCard>
      </AsyncState>

      <DefinitionAdminPage />

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={t("cluster.resetStatistics")}
        description={t("cluster.resetStatisticsWarning")}
        confirmText={t("cluster.resetStatistics")}
        variant="destructive"
        isConfirming={resetStatistics.isPending}
        error={resetStatistics.error}
        onConfirm={() =>
          resetStatistics.mutate(undefined, {
            onSuccess: () => setResetOpen(false),
          })
        }
      />
    </div>
  );
}
