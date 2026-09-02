import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ParameterManagementPage } from "@/components/shared/parameter-management-page";
import { useVhosts } from "@/domains/admin/vhosts/vhost-query";
import { redactFederationUris } from "@/domains/extensions/federation/federation-upstream-api";
import {
  federationUpstreamListQueryOptions,
  useDeleteFederationUpstream,
  useSaveFederationUpstream,
} from "@/domains/extensions/federation/federation-upstream-query";

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

  return (
    <ParameterManagementPage
      addLabel={t("federation.addUpstream")}
      emptyTitle={t("federation.emptyUpstreams")}
      deleteTitle={t("federation.deleteUpstream")}
      deleteDescription={(name) => t("federation.deleteUpstreamConfirm", { name })}
      tableLabel={t("federation.upstreams")}
      detailPath="/extensions/federation/upstreams/$vhost/$name"
      defaultValue={DEFAULT_VALUE}
      data={upstreams.data}
      isPending={upstreams.isPending}
      isError={upstreams.isError}
      error={upstreams.error}
      onRetry={() => upstreams.refetch()}
      vhosts={vhosts.data?.map(({ name }) => name) ?? []}
      saveError={save.error}
      isSaving={save.isPending}
      onSave={(input, callbacks) => save.mutate(input, callbacks)}
      deleteError={remove.error}
      isDeleting={remove.isPending}
      onDelete={(target, callbacks) => remove.mutate(target, callbacks)}
      redactValue={redactFederationUris}
    />
  );
}
