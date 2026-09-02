import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ParameterManagementPage } from "@/components/shared/parameter-management-page";
import { useVhosts } from "@/domains/admin/vhosts/vhost-query";
import { redactShovelUris } from "@/domains/extensions/shovels/shovel-parameter-api";
import {
  shovelParameterListQueryOptions,
  useDeleteShovel,
  useSaveShovel,
} from "@/domains/extensions/shovels/shovel-parameter-query";

const DEFAULT_VALUE = {
  "src-uri": "amqp://source-host",
  "src-queue": "source-queue",
  "dest-uri": "amqp://destination-host",
  "dest-queue": "destination-queue",
  "ack-mode": "on-confirm",
  "src-prefetch-count": 1000,
  "reconnect-delay": 1,
};

export function ShovelManagementPage() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const parameters = useQuery(shovelParameterListQueryOptions(context.apiClient));
  const vhosts = useVhosts(context.apiClient);
  const save = useSaveShovel(context.apiClient);
  const remove = useDeleteShovel(context.apiClient);

  return (
    <ParameterManagementPage
      addLabel={t("shovels.add")}
      emptyTitle={t("shovels.empty")}
      deleteTitle={t("shovels.delete")}
      deleteDescription={(name) => t("shovels.deleteConfirm", { name })}
      tableLabel={t("shovels.management")}
      detailPath="/extensions/shovels/management/$vhost/$name"
      defaultValue={DEFAULT_VALUE}
      data={parameters.data}
      isPending={parameters.isPending}
      isError={parameters.isError}
      error={parameters.error}
      onRetry={() => parameters.refetch()}
      vhosts={vhosts.data?.map(({ name }) => name) ?? []}
      saveError={save.error}
      isSaving={save.isPending}
      onSave={(input, callbacks) => save.mutate(input, callbacks)}
      deleteError={remove.error}
      isDeleting={remove.isPending}
      onDelete={(target, callbacks) => remove.mutate(target, callbacks)}
      redactValue={redactShovelUris}
    />
  );
}
