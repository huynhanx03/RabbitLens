import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { AsyncState } from "@/components/shared/async-state";
import { DataTable } from "@/components/shared/data-table";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Button } from "@/components/ui/button";
import type { TopProcess } from "@/domains/extensions/top/top-api";
import { topProcessesQueryOptions } from "@/domains/extensions/top/top-query";
import { nodesListQueryOptions } from "@/domains/nodes/nodes-query";
import { formatBytes } from "@/lib/utils";
import { TopScopeControls } from "./top-scope-controls";

const DEFAULT_ROW_COUNT = 20;

function processDisplayName(process: TopProcess) {
  return process.name.name ?? process.name.type ?? process.name.supertype ?? "—";
}

export function TopPage() {
  const { t } = useTranslation();
  const { apiClient } = useRouteContext({ from: "__root__" });
  const nodesQuery = useQuery(nodesListQueryOptions(apiClient, () => true));
  const [node, setNode] = useState("");
  const [rowCount, setRowCount] = useState(DEFAULT_ROW_COUNT);

  useEffect(() => {
    if (!node && nodesQuery.data?.[0]) setNode(nodesQuery.data[0].name);
  }, [node, nodesQuery.data]);

  const query = useQuery(topProcessesQueryOptions(apiClient, node, rowCount));
  const columns = useMemo<ColumnDef<TopProcess>[]>(
    () => [
      {
        accessorKey: "pid",
        header: t("top.pid"),
        cell: ({ row }) => (
          <Button asChild variant="link" className="h-auto p-0 font-mono">
            <Link
              to="/extensions/top/process/$pid"
              params={{ pid: row.original.pid }}
            >
              {row.original.pid}
            </Link>
          </Button>
        ),
      },
      {
        id: "name",
        header: t("top.name"),
        cell: ({ row }) => processDisplayName(row.original),
      },
      {
        accessorKey: "memory",
        header: t("top.memory"),
        cell: ({ row }) => formatBytes(row.original.memory),
      },
      { accessorKey: "reductions", header: t("top.reductions") },
      { accessorKey: "message_queue_len", header: t("top.messageQueue") },
      { accessorKey: "status", header: t("top.status") },
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
            <Link to="/extensions/top/ets">{t("top.etsTables")}</Link>
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
        isEmpty={!query.isPending && query.data?.processes.length === 0}
        emptyTitle={t("top.emptyProcesses")}
      >
        <DataTable
          ariaLabel={t("top.processes")}
          columns={columns}
          data={query.data?.processes ?? []}
          getRowId={(process) => process.pid}
        />
      </AsyncState>
    </div>
  );
}
