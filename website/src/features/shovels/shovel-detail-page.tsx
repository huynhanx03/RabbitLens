import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AsyncState } from "@/components/shared/async-state";
import { JsonParameterForm } from "@/components/shared/json-parameter-form";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { shovelParameterDetailQueryOptions, useSaveShovel } from "@/domains/extensions/shovels/shovel-parameter-query";

type Props = { vhost: string; name: string };

export function ShovelDetailPage({ vhost, name }: Props) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const navigate = useNavigate();
  const parameter = useQuery(shovelParameterDetailQueryOptions(context.apiClient, vhost, name));
  const save = useSaveShovel(context.apiClient);
  const returnToList = () => navigate({ to: "/extensions/shovels/management" });

  return (
    <div className="space-y-4">
      <DetailPageHeader title={name} description={t("shovels.edit")} />
      <MutationErrorAlert error={save.error} />
      <AsyncState
        isPending={parameter.isPending}
        isError={parameter.isError}
        error={parameter.error}
        onRetry={() => parameter.refetch()}
      >
        {parameter.data ? (
          <JsonParameterForm
            vhosts={[vhost]}
            initialVhost={vhost}
            initialName={name}
            initialValue={parameter.data.value}
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
