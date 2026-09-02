import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useRouteContext, Link } from "@tanstack/react-router";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { type ColumnDef } from "@tanstack/react-table";
import { type NodeResponse } from "@/api/nodes-schema";
import { nodesListQueryOptions } from "@/domains/nodes/nodes-query";

export function NodesPage() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const { data, isPending, isError } = useQuery(
    nodesListQueryOptions(context.apiClient, () => true),
  );

  if (isError) {
    return <div className="p-8 text-center text-destructive">{t("errors.unexpected")}</div>;
  }

  const columns: ColumnDef<NodeResponse>[] = [
    {
      accessorKey: "name",
      header: t("nodes.name"),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return (
          <Link
            to="/nodes/$name"
            params={{ name }}
            className="font-medium text-primary hover:underline"
          >
            {name}
          </Link>
        );
      },
    },
    {
      accessorKey: "type",
      header: t("common.type"),
    },
    {
      accessorKey: "running",
      header: t("nodes.status"),
      cell: ({ row }) => {
        const isRunning = row.getValue("running") as boolean;
        return isRunning ? (
          <StatusBadge variant="success">{t("nodes.running")}</StatusBadge>
        ) : (
          <StatusBadge variant="error">{t("nodes.stopped")}</StatusBadge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable columns={columns} data={data ?? []} isLoading={isPending} />
    </div>
  );
}
