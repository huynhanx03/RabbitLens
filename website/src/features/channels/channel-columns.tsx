import { type ColumnDef } from "@tanstack/react-table";
import type { ChannelViewModel } from "@/domains/channels/channel-view-model";
import { StatusBadge } from "@/components/shared/status-badge";
import { Link } from "@tanstack/react-router";
import { PRODUCT_DEFAULTS } from "@/config/defaults";

type StatusVariant = "success" | "warning" | "error" | "info" | "unknown";

function stateToVariant(state: string): StatusVariant {
  switch (state) {
    case "running":
      return "success";
    case "blocked":
    case "flow":
      return "warning";
    case "idle":
      return "info";
    default:
      return "unknown";
  }
}

export function createChannelColumns(
  t: (key: string) => string,
): ColumnDef<ChannelViewModel>[] {
  return [
    {
      accessorKey: "name",
      header: t("channels.name"),
      enableSorting: true,
      meta: { className: "min-w-72 max-w-[28rem]", variant: "code", wrap: "break" },
      cell: ({ getValue }) => {
        const name = getValue<string>();
        return <Link
          to="/channels/$name"
          params={{ name }}
          search={{ page: 1, pageSize: PRODUCT_DEFAULTS.tables.defaultPageSize, name: "", useRegex: false, sortReverse: false }}
          className="block max-w-[28rem] whitespace-normal break-all font-mono text-sm font-medium leading-relaxed text-primary underline-offset-4 hover:underline"
          title={name}
        >{name}</Link>;
      },
    },
    {
      accessorKey: "state",
      header: t("channels.state"),
      enableSorting: true,
      meta: { align: "center", variant: "status" },
      cell: ({ getValue }) => {
        const state = getValue<string>();
        return (
          <StatusBadge variant={stateToVariant(state)}>
            {state}
          </StatusBadge>
        );
      },
    },
    {
      id: "messages_unacknowledged",
      accessorFn: (row) => row.unacknowledged,
      header: t("channels.unacknowledged"),
      enableSorting: true,
      meta: { align: "center", variant: "numeric" },
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      id: "prefetch_count",
      accessorFn: (row) => row.prefetchCount,
      header: t("channels.prefetch"),
      enableSorting: true,
      meta: { align: "center", variant: "numeric" },
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: "publishRate",
      header: t("channels.publishRate"),
      enableSorting: false,
      meta: { align: "center", className: "hidden md:table-cell", variant: "numeric" },
      cell: ({ getValue }) => {
        const val = getValue<number | null>();
        return <span className="tabular-nums">{val !== null ? val.toFixed(1) : "—"}</span>;
      },
    },
    {
      accessorKey: "deliverRate",
      header: t("channels.deliverRate"),
      enableSorting: false,
      meta: { align: "center", className: "hidden md:table-cell", variant: "numeric" },
      cell: ({ getValue }) => {
        const val = getValue<number | null>();
        return <span className="tabular-nums">{val !== null ? val.toFixed(1) : "—"}</span>;
      },
    },
    {
      accessorKey: "ackRate",
      header: t("channels.ackRate"),
      enableSorting: false,
      meta: { align: "center", className: "hidden lg:table-cell", variant: "numeric" },
      cell: ({ getValue }) => {
        const val = getValue<number | null>();
        return <span className="tabular-nums">{val !== null ? val.toFixed(1) : "—"}</span>;
      },
    },
  ];
}
