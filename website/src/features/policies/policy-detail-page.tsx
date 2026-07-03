import { useParams, useRouteContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AsyncState } from "@/components/shared/async-state";
import { DefinitionList, type DefinitionItem } from "@/components/shared/definition-list";
import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { usePolicy } from "@/domains/admin/policies/policy-query";

export function PolicyDetailPage() {
  const { t } = useTranslation();
  const { apiClient } = useRouteContext({ from: "__root__" });
  const { vhost, name } = useParams({
    from: "/_authenticated/admin/policies/$vhost/$name",
  });
  const query = usePolicy(apiClient, vhost, name);
  const policy = query.data;
  const items: DefinitionItem[] = policy ? [
    { label: t("policies.vhost"), value: policy.vhost },
    { label: t("policies.name"), value: policy.name },
    { label: t("policies.pattern"), value: <code>{policy.pattern}</code> },
    { label: t("policies.applyTo"), value: <Badge variant="outline">{policy["apply-to"]}</Badge> },
    { label: t("policies.priority"), value: policy.priority },
    {
      label: t("policies.definition"),
      value: (
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
          {JSON.stringify(policy.definition, null, 2)}
        </pre>
      ),
    },
  ] : [];

  return (
    <div className="space-y-4">
      <DetailPageHeader
        title={name}
        description={t("policies.detailDescription")}
        metadata={[vhost]}
      />
      <AsyncState
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
      >
        <SectionCard title={t("policies.details")}>
          <DefinitionList items={items} unavailableLabel={t("common.unavailable")} />
        </SectionCard>
      </AsyncState>
    </div>
  );
}
