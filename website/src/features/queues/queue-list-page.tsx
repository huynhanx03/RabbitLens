import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import type { SortingState } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Button } from "@/components/ui/button";
import { createQueueColumns } from "./queue-columns";
import { createQueueViewModel, type QueueViewModel } from "./queue-view-model";
import { getQueues } from "@/domains/queues/queue-api";
import { queueKeys } from "@/domains/queues/queue-query";
import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { CreateQueueDialog } from "./create-queue-dialog";
import type { ResourceListSearch } from "@/api/pagination-schema";
import { overviewQueryOptions } from "@/domains/overview/overview-query";
import { resolveStatisticsMode, getStatisticsSelectors } from "@/api/statistics-capabilities";
import { Route } from "@/app/routes/_authenticated/queues/index";

type QueueListPageProps = {
  search: ResourceListSearch;
};

export function QueueListPage({ search }: QueueListPageProps) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const navigate = useNavigate({ from: Route.fullPath });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const overviewQuery = useQuery(
    overviewQueryOptions(context.apiClient, () => true),
  );
  const statsMode = resolveStatisticsMode(overviewQuery.data);
  const statsCapabilities = getStatisticsSelectors(statsMode);

  const { data, isLoading } = useQuery({
    queryKey: queueKeys.list(search),
    queryFn: ({ signal }) => getQueues(context.apiClient, search, signal),
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs),
  });

  const columns = useMemo(() => createQueueColumns(t), [t]);

  const rows = useMemo<QueueViewModel[]>(
    () => data?.items.map(createQueueViewModel) ?? [],
    [data],
  );

  const updateSearch = (updates: Partial<ResourceListSearch>) => {
    navigate({ search: (previous) => ({ ...previous, ...updates }) });
  };

  const sorting: SortingState = search.sort
    ? [{ id: search.sort, desc: search.sortReverse }]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <FilterBar
            name={search.name}
            useRegex={search.useRegex}
            onSubmit={(name, useRegex) => updateSearch({ name, useRegex, page: 1 })}
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          {t("common.add")} Queue
        </Button>
      </div>

      <CreateQueueDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        vhost="%2F"
      />

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        sorting={sorting}
        columnVisibility={{
          publishRate: statsCapabilities.canShowRates,
          deliverRate: statsCapabilities.canShowRates,
          ackRate: statsCapabilities.canShowRates,
          messagesReady: statsCapabilities.canShowQueueTotals,
          messagesUnacked: statsCapabilities.canShowQueueTotals,
          messagesTotal: statsCapabilities.canShowQueueTotals,
        }}
        onSortingChange={(next) => {
          const col = next[0];
          if (col) {
            updateSearch({ sort: col.id, sortReverse: col.desc, page: 1 });
          } else {
            updateSearch({ sort: undefined, sortReverse: false });
          }
        }}
        onRowClick={(row) =>
          navigate({
            to: "/queues/$vhost/$name",
            params: { vhost: row.vhost, name: row.name },
          })
        }
        getRowId={(row) => `${row.vhost}/${row.name}`}
      />

      {data && (
        <PaginationControls
          page={data.page}
          pageCount={data.page_count}
          pageSize={data.page_size}
          filteredCount={data.filtered_count}
          totalCount={data.total_count}
          onPageChange={(page) => updateSearch({ page })}
          onPageSizeChange={(pageSize) => updateSearch({ pageSize, page: 1 })}
        />
      )}
    </div>
  );
}
