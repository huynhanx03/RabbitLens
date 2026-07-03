import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type RowData,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveDataViewport } from "./responsive-data-viewport";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  /** Server-side sorting state */
  sorting?: SortingState;
  /** Callback for server-side sort changes */
  onSortingChange?: (sorting: SortingState) => void;
  /** Column visibility map */
  columnVisibility?: VisibilityState;
  /** Row click handler */
  onRowClick?: (row: TData) => void;
  /** Custom row ID accessor */
  getRowId?: (row: TData) => string;
  /** Accessible name announced for the table. */
  ariaLabel?: string;
  /** Rich empty state rendered when no rows are available. */
  emptyState?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  sorting,
  onSortingChange,
  columnVisibility,
  onRowClick,
  getRowId,
  ariaLabel,
  emptyState,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    state: {
      sorting: sorting ?? [],
      columnVisibility: columnVisibility ?? {},
    },
    onSortingChange: onSortingChange
      ? (updaterOrValue) => {
          const next =
            typeof updaterOrValue === "function"
              ? updaterOrValue(sorting ?? [])
              : updaterOrValue;
          onSortingChange(next);
        }
      : undefined,
    getRowId,
  });

  return (
    <ResponsiveDataViewport className="rounded-xl border bg-card shadow-sm">
      <Table aria-label={ariaLabel} className="min-w-[48rem]">
        <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    className={header.column.columnDef.meta?.className}
                    aria-sort={
                      sorted === "asc"
                        ? "ascending"
                        : sorted === "desc"
                          ? "descending"
                          : canSort
                            ? "none"
                            : undefined
                    }
                  >
                    {canSort ? (
                      <button
                        type="button"
                        className="flex w-full cursor-pointer select-none items-center gap-1 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      {canSort && (
                        <span className="size-4 text-muted-foreground">
                          {sorted === "asc" ? (
                            <ArrowUp className="size-4" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-4" />
                          ) : (
                            <ArrowUpDown className="size-4 opacity-50" />
                          )}
                        </span>
                      )}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </span>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                {table.getVisibleLeafColumns().map((col) => (
                  <TableCell key={col.id}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset" : ""}
                onClick={onRowClick ? (event) => {
                  const target = event.target as HTMLElement;
                  if (target.closest("button, a, input, select, textarea, [role='menuitem']")) {
                    return;
                  }
                  onRowClick(row.original);
                } : undefined}
                onKeyDown={onRowClick ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRowClick(row.original);
                  }
                } : undefined}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cell.column.columnDef.meta?.className}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getVisibleLeafColumns().length}
                className="h-24 text-center"
              >
                {emptyState ?? t("common.noData", "No results.")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ResponsiveDataViewport>
  );
}
