import { type ColumnDef } from "@tanstack/react-table";
import type { QueueViewModel } from "./queue-view-model";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, type StatusVariant } from "@/components/shared/status-badge";

function stateToVariant(state: string): StatusVariant {
  switch (state) {
    case "running":
      return "success";
    case "idle":
      return "info";
    case "flow":
      return "warning";
    case "down":
    case "crashed":
      return "error";
    default:
      return "unknown";
  }
}

export function createQueueColumns(
  t: (key: string) => string,
): ColumnDef<QueueViewModel>[] {
  return [
    {
      accessorKey: "vhost",
      header: t("queues.vhost"),
      enableSorting: true,
    },
    {
      accessorKey: "name",
      header: t("queues.name"),
      enableSorting: true,
      meta: { className: "min-w-60 max-w-[24rem]", variant: "code", wrap: "break" },
      cell: ({ getValue }) => (
        <span className="font-mono text-sm font-medium">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: t("queues.type"),
      enableSorting: true,
    },
    {
      accessorKey: "features",
      header: t("queues.features"),
      meta: { wrap: "normal" },
      cell: ({ getValue }) => {
        const features = getValue<string[]>();
        if (features.length === 0) return null;
        return (
          <div className="flex flex-wrap gap-1">
            {features.map((f) => (
              <Badge key={f} variant="outline" className="h-5 px-1.5 text-[10px]">
                {f}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "state",
      header: t("queues.state"),
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
      accessorKey: "messagesReady",
      header: t("queues.ready"),
      enableSorting: true,
      meta: { align: "center", variant: "numeric" },
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: "messagesUnacked",
      header: t("queues.unacked"),
      enableSorting: true,
      meta: { align: "center", variant: "numeric" },
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: "messagesTotal",
      header: t("queues.total"),
      enableSorting: true,
      meta: { align: "center", variant: "numeric" },
      cell: ({ getValue }) => (
        <span className="tabular-nums font-medium">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: "publishRate",
      header: t("queues.publishRate"),
      enableSorting: true,
      meta: { align: "center", variant: "numeric" },
      cell: ({ getValue }) => {
        const val = getValue<number | null>();
        return <span className="tabular-nums">{val !== null ? val.toFixed(1) : "—"}</span>;
      },
    },
    {
      accessorKey: "deliverRate",
      header: t("queues.deliverRate"),
      enableSorting: true,
      meta: { align: "center", variant: "numeric" },
      cell: ({ getValue }) => {
        const val = getValue<number | null>();
        return <span className="tabular-nums">{val !== null ? val.toFixed(1) : "—"}</span>;
      },
    },
    {
      accessorKey: "ackRate",
      header: t("queues.ackRate"),
      enableSorting: true,
      meta: { align: "center", variant: "numeric" },
      cell: ({ getValue }) => {
        const val = getValue<number | null>();
        return <span className="tabular-nums">{val !== null ? val.toFixed(1) : "—"}</span>;
      },
    },
  ];
}
