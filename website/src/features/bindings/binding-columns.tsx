import type { ColumnDef } from "@tanstack/react-table";
import { type TFunction } from "i18next";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Binding } from "@/domains/bindings/binding-schema";
import { AmqpValue } from "@/components/shared/amqp-value";
import { Link } from "@tanstack/react-router";

export function createBindingColumns(
  t: TFunction,
  onDelete: (binding: Binding) => void,
  mode: "to-exchange" | "from-exchange" | "to-queue"
): ColumnDef<Binding>[] {
  const columns: ColumnDef<Binding>[] = [];

  if (mode !== "to-queue") {
    // Both exchange modes have a source or destination that varies
    if (mode === "to-exchange") {
      columns.push({
        id: "source",
        header: t("bindings.source"),
        cell: ({ row }) => (
          <Link
            to="/exchanges/$vhost/$name"
            params={{
              vhost: row.original.vhost,
              name: row.original.source || "_default_",
            }}
            className="text-primary hover:underline"
          >
            {row.original.source === "" ? "(AMQP default)" : row.original.source}
          </Link>
        ),
      });
    } else {
      columns.push({
        id: "destination",
        header: t("bindings.destination"),
        cell: ({ row }) => {
          const isQueue = row.original.destination_type === "queue";
          const label = row.original.destination === "" ? "(AMQP default)" : row.original.destination;
          return isQueue ? (
            <Link
              to="/queues/$vhost/$name"
              params={{ vhost: row.original.vhost, name: row.original.destination }}
              className="text-primary hover:underline"
            >
              {label}
            </Link>
          ) : (
            <Link
              to="/exchanges/$vhost/$name"
              params={{
                vhost: row.original.vhost,
                name: row.original.destination || "_default_",
              }}
              className="text-primary hover:underline"
            >
              {label}
            </Link>
          );
        },
      });
      columns.push({
        accessorKey: "destination_type",
        header: t("exchanges.type"),
      });
    }
  } else {
    // Mode to-queue (in Queue page)
    columns.push({
      id: "source",
      header: t("bindings.source"),
      cell: ({ row }) => (
        <Link
          to="/exchanges/$vhost/$name"
          params={{
            vhost: row.original.vhost,
            name: row.original.source || "_default_",
          }}
          className="text-primary hover:underline"
        >
          {row.original.source === "" ? "(AMQP default)" : row.original.source}
        </Link>
      ),
    });
  }

  columns.push({
    accessorKey: "routing_key",
    header: t("bindings.routingKey"),
  });

  columns.push({
    id: "arguments",
    header: t("bindings.arguments"),
    cell: ({ row }) => <AmqpValue value={row.original.arguments} />,
  });

  columns.push({
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(row.original);
          }}
          title={t("common.remove")}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    ),
  });

  return columns;
}
