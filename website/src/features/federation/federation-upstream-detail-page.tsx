import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AsyncState } from "@/components/shared/async-state";
import { JsonParameterForm } from "@/components/shared/json-parameter-form";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { federationUpstreamDetailQueryOptions, useSaveFederationUpstream } from "@/domains/extensions/federation/federation-upstream-query";

type Props = { vhost: string; name: string };

export function FederationUpstreamDetailPage({ vhost, name }: Props) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const navigate = useNavigate();
  const upstream = useQuery(federationUpstreamDetailQueryOptions(context.apiClient, vhost, name));
  const save = useSaveFederationUpstream(context.apiClient);
  const returnToList = () => navigate({ to: "/extensions/federation/upstreams" });

  return (
    <div className="space-y-4">
      <DetailPageHeader title={name} description={t("federation.editUpstream")} />
      <MutationErrorAlert error={save.error} />
      <AsyncState
        isPending={upstream.isPending}
        isError={upstream.isError}
        error={upstream.error}
        onRetry={() => upstream.refetch()}
      >
        {upstream.data ? (
          <JsonParameterForm
            vhosts={[vhost]}
            initialVhost={vhost}
            initialName={name}
            initialValue={upstream.data.value}
            isUpdate
            isPending={save.isPending}
            onCancel={returnToList}
            onSubmit={(input) => save.mutate(input, { onSuccess: returnToList })}
          />
        ) : null}
      </AsyncState>
    </div>
  );
}
