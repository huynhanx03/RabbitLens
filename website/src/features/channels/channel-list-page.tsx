import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { Route } from "@/app/routes/_authenticated/channels/index";
import { AsyncState } from "@/components/shared/async-state";
import { DataTable } from "@/components/shared/data-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { channelListQueryOptions } from "@/domains/channels/channel-query";
import { createChannelViewModel, type ChannelViewModel } from "@/domains/channels/channel-view-model";
import type { ResourceListSearch } from "@/api/pagination-schema";
import { createChannelColumns } from "./channel-columns";

export function ChannelListPage() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "/_authenticated/channels/" });
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const query = useQuery(channelListQueryOptions(context.apiClient, search));
  const columns = useMemo(() => createChannelColumns(t), [t]);
  const rows = useMemo<ChannelViewModel[]>(() => query.data?.items.map(createChannelViewModel) ?? [], [query.data]);
  const sorting: SortingState = search.sort ? [{ id: search.sort, desc: search.sortReverse }] : [];
  const updateSearch = (updates: Partial<ResourceListSearch>) => navigate({ search: (previous) => ({ ...previous, ...updates }) });

  return (
    <div className="space-y-4">
      <PageToolbar
        ariaLabel={t("channels.toolbar")}
        primary={
          <FilterBar
            name={search.name}
            useRegex={search.useRegex}
            onSubmit={(name, useRegex) =>
              updateSearch({ name, useRegex, page: 1 })
            }
          />
        }
        secondary={query.data ? (
          <span className="text-sm text-muted-foreground">
            {t("channels.resultCount", { count: query.data.filtered_count })}
          </span>
        ) : undefined}
      />
      <AsyncState error={query.error} isError={query.isError} onRetry={() => query.refetch()}>
        <DataTable
          ariaLabel={t("channels.tableLabel")}
          columns={columns}
          data={rows}
          isLoading={query.isPending}
          sorting={sorting}
          onSortingChange={(next) => {
            const column = next[0];
            updateSearch(column ? { sort: column.id, sortReverse: column.desc, page: 1 } : { sort: undefined, sortReverse: false, page: 1 });
          }}
          onRowClick={(row) => navigate({ to: "/channels/$name", params: { name: row.name }, search })}
          getRowId={(row) => row.name}
        />
      </AsyncState>
      {query.data ? <PaginationControls page={query.data.page} pageCount={query.data.page_count} pageSize={query.data.page_size} filteredCount={query.data.filtered_count} totalCount={query.data.total_count} onPageChange={(page) => updateSearch({ page })} onPageSizeChange={(pageSize) => updateSearch({ pageSize, page: 1 })} /> : null}
    </div>
  );
}
