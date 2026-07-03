import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { SortingState, VisibilityState } from "@tanstack/react-table";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { Cable, RefreshCw } from "lucide-react";
import { Route } from "@/app/routes/_authenticated/connections/index";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { FilterBar } from "@/components/shared/filter-bar";
import { DataTable } from "@/components/shared/data-table";
import { TableViewOptions } from "@/components/shared/table-view-options";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { AsyncState } from "@/components/shared/async-state";
import { Button } from "@/components/ui/button";
import {
  createConnectionViewModel,
  type ConnectionViewModel,
} from "@/domains/connections/connection-view-model";
import {
  connectionListQueryOptions,
  useCloseConnectionMutation,
} from "@/domains/connections/connection-query";
import type { ResourceListSearch } from "@/api/pagination-schema";
import { cn } from "@/lib/utils";
import { createConnectionColumns } from "./connection-columns";

const COLUMN_IDS = [
  "name",
  "user",
  "vhost",
  "state",
  "protocol",
  "channels",
  "ssl",
  "peerEndpoint",
  "node",
  "actions",
] as const;

export function ConnectionListPage() {
  const { t, i18n } = useTranslation();
  const context = useRouteContext({ from: "/_authenticated/connections/" });
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const [connectionToClose, setConnectionToClose] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    ...COLUMN_IDS,
  ]);
  const closeConnectionMutation = useCloseConnectionMutation(context.apiClient);

  const query = useQuery(
    connectionListQueryOptions(context.apiClient, search),
  );

  const columns = useMemo(
    () => createConnectionColumns(t, setConnectionToClose),
    [t],
  );
  const rows = useMemo<ConnectionViewModel[]>(
    () => query.data?.items.map(createConnectionViewModel) ?? [],
    [query.data],
  );
  const columnVisibility = useMemo<VisibilityState>(
    () =>
      Object.fromEntries(
        COLUMN_IDS.map((id) => [id, visibleColumns.includes(id)]),
      ),
    [visibleColumns],
  );

  const updateSearch = (updates: Partial<ResourceListSearch>) => {
    navigate({ search: (previous) => ({ ...previous, ...updates }) });
  };
  const clearFilter = () =>
    updateSearch({ name: "", useRegex: false, page: 1 });

  const sorting: SortingState = search.sort
    ? [{ id: search.sort, desc: search.sortReverse }]
    : [];
  const hasFilter = Boolean(search.name || search.useRegex);
  const lastUpdated = query.dataUpdatedAt
    ? new Intl.DateTimeFormat(i18n.language, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(query.dataUpdatedAt)
    : null;

  return (
    <div className="space-y-4">
      <PageToolbar
        ariaLabel={t("connections.toolbar")}
        primary={
          <FilterBar
            name={search.name}
            useRegex={search.useRegex}
            onSubmit={(name, useRegex) =>
              updateSearch({ name, useRegex, page: 1 })
            }
          />
        }
        secondary={
          <>
          <div className="flex items-center gap-2">
            {lastUpdated ? (
              <span className="hidden text-xs text-muted-foreground lg:inline">
                {t("common.updatedAt", { time: lastUpdated })}
              </span>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw
                aria-hidden="true"
                className={cn("size-4", query.isFetching && "animate-spin")}
              />
              {query.isFetching ? t("common.refreshing") : t("common.refresh")}
            </Button>
          </div>
          <TableViewOptions
            columns={COLUMN_IDS.filter((id) => id !== "actions").map((id) => ({
              id,
              label: t(`connections.${id}`),
            }))}
            visible={visibleColumns.filter((id) => id !== "actions")}
            onVisibleChange={(next) => setVisibleColumns([...next, "actions"])}
          />
          </>
        }
      />

      <MutationErrorAlert error={closeConnectionMutation.error} />

      <AsyncState
        error={query.error}
        isError={query.isError}
        onRetry={() => query.refetch()}
      >
        <DataTable
          ariaLabel={t("connections.tableLabel")}
          columns={columns}
          data={rows}
          isLoading={query.isPending}
          sorting={sorting}
          columnVisibility={columnVisibility}
          emptyState={
            <div className="flex flex-col items-center gap-2 py-5 text-muted-foreground">
              <Cable aria-hidden="true" className="size-7" />
              <p className="font-medium text-foreground">
                {hasFilter
                  ? t("connections.noMatches")
                  : t("connections.emptyTitle")}
              </p>
              <p className="max-w-md whitespace-normal text-sm">
                {hasFilter
                  ? t("connections.noMatchesDescription")
                  : t("connections.emptyDescription")}
              </p>
              {hasFilter ? (
                <Button type="button" variant="outline" size="sm" onClick={clearFilter}>
                  {t("filters.clear")}
                </Button>
              ) : null}
            </div>
          }
          onSortingChange={(next) => {
            const column = next[0];
            updateSearch(
              column
                ? { sort: column.id, sortReverse: column.desc, page: 1 }
                : { sort: undefined, sortReverse: false, page: 1 },
            );
          }}
          onRowClick={(row) =>
            navigate({
              to: "/connections/$name",
              params: { name: row.name },
              search,
            })
          }
          getRowId={(row) => row.name}
        />
      </AsyncState>

      {query.data ? (
        <PaginationControls
          page={query.data.page}
          pageCount={query.data.page_count}
          pageSize={query.data.page_size}
          filteredCount={query.data.filtered_count}
          totalCount={query.data.total_count}
          onPageChange={(page) => updateSearch({ page })}
          onPageSizeChange={(pageSize) => updateSearch({ pageSize, page: 1 })}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(connectionToClose)}
        onOpenChange={(open) => !open && setConnectionToClose(null)}
        title={t("connections.closeTitle")}
        description={t("connections.closeDescription", {
          name: connectionToClose,
        })}
        confirmText={t("connections.forceClose")}
        onConfirm={() => {
          if (!connectionToClose) return;
          closeConnectionMutation.mutate(
            { name: connectionToClose },
            { onSuccess: () => setConnectionToClose(null) },
          );
        }}
        isConfirming={closeConnectionMutation.isPending}
        error={closeConnectionMutation.error}
        variant="destructive"
      />
    </div>
  );
}
