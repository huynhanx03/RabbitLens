import { useTranslation } from "react-i18next";
import { useNodes } from "@/api/hooks";
import { useRouteContext, Link } from "@tanstack/react-router";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { type ColumnDef } from "@tanstack/react-table";
import { type NodeResponse } from "@/api/nodes-schema";

export function NodesPage() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const { data, isPending, isError } = useNodes(context.apiClient);

  if (isError) {
    return <div className="p-8 text-center text-destructive">{t("errors.unexpected")}</div>;
  }

  const columns: ColumnDef<NodeResponse>[] = [
    {
      accessorKey: "name",
      header: "Name",
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
      header: "Type",
    },
    {
      accessorKey: "running",
      header: "Status",
      cell: ({ row }) => {
        const isRunning = row.getValue("running") as boolean;
        return isRunning ? (
          <StatusBadge variant="success">Running</StatusBadge>
        ) : (
          <StatusBadge variant="error">Stopped</StatusBadge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isPending}
      />
    </div>
  );
}
