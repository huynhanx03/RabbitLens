import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { LockKeyhole, Trash2 } from "lucide-react";
import type { ConnectionViewModel } from "@/domains/connections/connection-view-model";
import { StatusBadge, type StatusVariant } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { destructiveIconButtonClassName } from "@/lib/utils";

type Translate = (key: string, options?: Record<string, unknown>) => string;

function stateToVariant(state: string): StatusVariant {
  switch (state) {
    case "running":
      return "success";
    case "blocked":
    case "blocking":
    case "flow":
      return "warning";
    case "closed":
      return "error";
    default:
      return "warning";
  }
}

export function createConnectionColumns(
  t: Translate,
  onClose: (name: string) => void,
): ColumnDef<ConnectionViewModel>[] {
  return [
    {
      accessorKey: "name",
      header: t("connections.name"),
      enableSorting: true,
      meta: { className: "min-w-72 max-w-[28rem]", variant: "code", wrap: "break" },
      cell: ({ getValue }) => {
        const name = getValue<string>();
        return (
          <Link
            to="/connections/$name"
            params={{ name }}
            search={{
              page: 1,
              pageSize: PRODUCT_DEFAULTS.tables.defaultPageSize,
              name: "",
              useRegex: false,
              sortReverse: false,
            }}
            className="block max-w-[28rem] whitespace-normal break-all font-mono text-sm font-medium leading-relaxed text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title={name}
          >
            {name}
          </Link>
        );
      },
    },
    {
      accessorKey: "user",
      header: t("connections.user"),
      enableSorting: true,
    },
    {
      accessorKey: "vhost",
      header: t("connections.vhost"),
      enableSorting: true,
    },
    {
      accessorKey: "state",
      header: t("connections.state"),
      enableSorting: true,
      meta: { align: "center", variant: "status" },
      cell: ({ getValue }) => {
        const state = getValue<string>();
        return (
          <span className="flex justify-center">
            <StatusBadge variant={stateToVariant(state)}>{state}</StatusBadge>
          </span>
        );
      },
    },
    {
      accessorKey: "protocol",
      header: t("connections.protocol"),
      enableSorting: true,
      meta: { className: "hidden md:table-cell" },
    },
    {
      accessorKey: "channels",
      header: t("connections.channels"),
      enableSorting: true,
      meta: { align: "center", className: "hidden md:table-cell", variant: "numeric" },
      cell: ({ getValue }) => (
        <span className="block text-center tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: "ssl",
      header: t("connections.ssl"),
      meta: { align: "center", className: "hidden md:table-cell" },
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <span
            className="inline-flex items-center gap-1.5 text-success"
            aria-label={t("connections.tlsEnabled")}
          >
            <LockKeyhole aria-hidden="true" className="size-4" />
            <span className="text-xs font-medium">TLS</span>
          </span>
        ) : (
          <span
            aria-label={t("connections.tlsDisabled")}
            className="text-muted-foreground"
          >
            —
          </span>
        ),
    },
    {
      accessorKey: "peerEndpoint",
      header: t("connections.peerAddress"),
      enableSorting: false,
      meta: { className: "hidden lg:table-cell", variant: "code" },
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: "node",
      header: t("connections.node"),
      enableSorting: true,
      meta: { className: "hidden xl:table-cell", variant: "code" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("common.actions")}</span>,
      enableSorting: false,
      meta: { align: "center", variant: "actions" },
      cell: ({ row }) => {
        const name = row.original.name;
        return (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={destructiveIconButtonClassName}
              aria-label={t("connections.forceCloseFor", { name })}
              title={t("connections.forceClose")}
              onClick={() => onClose(name)}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        );
      },
    },
  ];
}
