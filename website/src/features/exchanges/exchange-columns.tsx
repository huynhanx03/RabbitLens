import { type ColumnDef } from "@tanstack/react-table";
import type { ExchangeViewModel } from "./exchange-view-model";
import { Badge } from "@/components/ui/badge";

export function createExchangeColumns(
  t: (key: string) => string,
): ColumnDef<ExchangeViewModel>[] {
  return [
    {
      accessorKey: "vhost",
      header: t("exchanges.vhost"),
      enableSorting: true,
    },
    {
      accessorKey: "name",
      header: t("exchanges.name"),
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
      header: t("exchanges.type"),
      enableSorting: true,
    },
    {
      accessorKey: "features",
      header: t("exchanges.features"),
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
      accessorKey: "publishInRate",
      header: t("exchanges.publishInRate"),
      enableSorting: true,
      meta: { align: "center", variant: "numeric" },
      cell: ({ getValue }) => {
        const val = getValue<number | null>();
        return <span className="tabular-nums">{val !== null ? val.toFixed(1) : "—"}</span>;
      },
    },
    {
      accessorKey: "publishOutRate",
      header: t("exchanges.publishOutRate"),
      enableSorting: true,
      meta: { align: "center", variant: "numeric" },
      cell: ({ getValue }) => {
        const val = getValue<number | null>();
        return <span className="tabular-nums">{val !== null ? val.toFixed(1) : "—"}</span>;
      },
    },
  ];
}
