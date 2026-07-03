import { useMemo, useState } from "react";
import { useRouteContext } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { AsyncState } from "@/components/shared/async-state";
import { DataTable } from "@/components/shared/data-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { useDeprecatedFeatures } from "@/domains/admin/deprecated-features/deprecated-feature-query";
import type { DeprecatedFeatureResponse } from "@/domains/admin/deprecated-features/deprecated-feature-schema";

export function DeprecatedFeatureListPage() {
  const { t } = useTranslation();
  const { apiClient } = useRouteContext({ from: "__root__" });
  const query = useDeprecatedFeatures(apiClient);
  const [filter, setFilter] = useState("");
  const rows = (query.data ?? []).filter((feature) => {
    const needle = filter.toLowerCase();
    return feature.name.toLowerCase().includes(needle)
      || feature.desc?.toLowerCase().includes(needle);
  });
  const columns = useMemo<ColumnDef<DeprecatedFeatureResponse>[]>(
    () => [
      { accessorKey: "name", header: t("common.name") },
      { accessorKey: "desc", header: t("deprecatedFeatures.descriptionColumn") },
      {
        accessorKey: "docs_url",
        header: t("deprecatedFeatures.documentation"),
        cell: ({ row }) => row.original.docs_url ? (
          <a
            href={row.original.docs_url}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            {t("deprecatedFeatures.readMore")}
          </a>
        ) : "—",
      },
    ],
    [t],
  );

  return (
    <div className="space-y-4">
      <PageToolbar
        ariaLabel={t("deprecatedFeatures.filter")}
        primary={
          <FilterBar
            name={filter}
            useRegex={false}
            onSubmit={(name) => setFilter(name)}
          />
        }
      />
      <AsyncState
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        isEmpty={!query.isPending && rows.length === 0}
        emptyTitle={t("deprecatedFeatures.empty")}
      >
        <DataTable
          ariaLabel={t("deprecatedFeatures.title")}
          columns={columns}
          data={rows}
          getRowId={(feature) => feature.name}
        />
      </AsyncState>
    </div>
  );
}
