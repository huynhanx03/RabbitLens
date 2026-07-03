import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import type { ResourceListSearch } from "@/api/pagination-schema";
import { AsyncState } from "@/components/shared/async-state";
import { DataTable } from "@/components/shared/data-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import type { StreamConnection } from "@/domains/extensions/streams/stream-api";
import { streamConnectionListQueryOptions } from "@/domains/extensions/streams/stream-query";

type Props = { search: ResourceListSearch };

export function StreamConnectionListPage({ search }: Props) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const navigate = useNavigate();
  const query = useQuery(streamConnectionListQueryOptions(context.apiClient, search));
  const updateSearch = (updates: Partial<ResourceListSearch>) =>
    navigate({
      to: "/extensions/streams/connections",
      search: { ...search, ...updates },
    });

  const columns = useMemo<ColumnDef<StreamConnection>[]>(
    () => [
      { accessorKey: "vhost", header: t("vhosts.title") },
      {
        accessorKey: "name",
        header: t("common.name"),
        cell: ({ row }) =>
          row.original.client_properties?.connection_name ?? row.original.name,
      },
      { accessorKey: "user", header: t("connections.user") },
      {
        accessorKey: "state",
        header: t("connections.state"),
        cell: ({ row }) => (
          <StatusBadge variant={row.original.state === "running" ? "success" : "warning"}>
            {row.original.state ?? t("common.unknown")}
          </StatusBadge>
        ),
      },
      { accessorKey: "protocol", header: t("connections.protocol") },
      {
        accessorKey: "ssl",
        header: t("connections.ssl"),
        cell: ({ row }) => (row.original.ssl ? "TLS" : "—"),
      },
    ],
    [t],
  );

  return (
    <div className="space-y-4">
      <PageToolbar
        ariaLabel={t("streams.connections")}
        primary={
          <FilterBar
            name={search.name}
            useRegex={search.useRegex}
            onSubmit={(name, useRegex) => updateSearch({ name, useRegex, page: 1 })}
          />
        }
        secondary={
          <Button asChild variant="outline">
            <Link to="/extensions/streams/super-streams">
              {t("streams.superStreams")}
            </Link>
          </Button>
        }
      />
      <AsyncState
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        isEmpty={!query.isPending && query.data?.items.length === 0}
        emptyTitle={t("streams.emptyConnections")}
      >
        <DataTable
          ariaLabel={t("streams.connections")}
          columns={columns}
          data={query.data?.items ?? []}
          getRowId={(row) => `${row.vhost}:${row.name}`}
          onRowClick={(row) =>
            navigate({
              to: "/extensions/streams/connections/$vhost/$name",
              params: { vhost: row.vhost, name: row.name },
            })
          }
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
    </div>
  );
}
