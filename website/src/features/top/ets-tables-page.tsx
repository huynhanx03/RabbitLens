import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { AsyncState } from "@/components/shared/async-state";
import { DataTable } from "@/components/shared/data-table";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Button } from "@/components/ui/button";
import type { EtsTable } from "@/domains/extensions/top/top-api";
import { etsTablesQueryOptions } from "@/domains/extensions/top/top-query";
import { nodesListQueryOptions } from "@/domains/nodes/nodes-query";
import { formatBytes } from "@/lib/utils";
import { TopScopeControls } from "./top-scope-controls";

const DEFAULT_ROW_COUNT = 20;

export function EtsTablesPage() {
  const { t } = useTranslation();
  const { apiClient } = useRouteContext({ from: "__root__" });
  const nodesQuery = useQuery(nodesListQueryOptions(apiClient, () => true));
  const [node, setNode] = useState("");
  const [rowCount, setRowCount] = useState(DEFAULT_ROW_COUNT);

  useEffect(() => {
    if (!node && nodesQuery.data?.[0]) setNode(nodesQuery.data[0].name);
  }, [node, nodesQuery.data]);

  const query = useQuery(etsTablesQueryOptions(apiClient, node, rowCount));
  const columns = useMemo<ColumnDef<EtsTable>[]>(
    () => [
      { accessorKey: "name", header: t("top.name") },
      {
        accessorKey: "owner",
        header: t("top.owner"),
        cell: ({ row }) => (
          <Button asChild variant="link" className="h-auto p-0 font-mono">
            <Link
              to="/extensions/top/process/$pid"
              params={{ pid: row.original.owner }}
            >
              {row.original.owner}
            </Link>
          </Button>
        ),
      },
      {
        accessorKey: "memory",
        header: t("top.memory"),
        cell: ({ row }) => formatBytes(row.original.memory),
      },
      { accessorKey: "size", header: t("top.size") },
      { accessorKey: "type", header: t("top.type") },
      { accessorKey: "protection", header: t("top.protection") },
    ],
    [t],
  );

  return (
    <div className="space-y-4">
      <PageToolbar
        ariaLabel={t("top.filters")}
        primary={
          <TopScopeControls
            nodes={nodesQuery.data ?? []}
            node={node}
            rowCount={rowCount}
            onNodeChange={setNode}
            onRowCountChange={setRowCount}
          />
        }
        secondary={
          <Button asChild variant="outline">
            <Link to="/extensions/top">{t("top.processes")}</Link>
          </Button>
        }
      />
      <AsyncState
        isPending={nodesQuery.isPending || query.isPending}
        isError={nodesQuery.isError || query.isError}
        error={nodesQuery.error ?? query.error}
        onRetry={() => {
          void nodesQuery.refetch();
          void query.refetch();
        }}
        isEmpty={!query.isPending && query.data?.ets_tables.length === 0}
        emptyTitle={t("top.emptyTables")}
      >
        <DataTable
          ariaLabel={t("top.etsTables")}
          columns={columns}
          data={query.data?.ets_tables ?? []}
          getRowId={(table) => `${table.owner}:${table.name}`}
        />
      </AsyncState>
    </div>
  );
}
