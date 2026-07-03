import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

export type PaginationControlsProps = {
  /** Current page (1-indexed) from API envelope */
  page: number;
  /** Total pages from API envelope */
  pageCount: number;
  /** Current page size */
  pageSize: number;
  /** Total filtered items from API envelope */
  filteredCount: number;
  /** Total items from API envelope */
  totalCount: number;
  /** Called when user navigates pages */
  onPageChange: (page: number) => void;
  /** Called when user changes page size */
  onPageSizeChange: (pageSize: number) => void;
};

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200, 500];

export function PaginationControls({
  page,
  pageCount,
  pageSize,
  filteredCount,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("pagination.label")}
      className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="text-sm text-muted-foreground">
        {filteredCount === totalCount
          ? t("pagination.totalItems", { count: totalCount })
          : t("pagination.filteredItems", {
              filtered: filteredCount,
              total: totalCount,
            })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-[80px]" aria-label={t("pagination.pageSize")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          aria-label={t("pagination.firstPage")}
        >
          <ChevronsLeft aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label={t("pagination.previousPage")}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <span className="min-w-24 px-1 text-center text-sm tabular-nums">
          {t("pagination.pageOf", { page, pageCount: Math.max(pageCount, 1) })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label={t("pagination.nextPage")}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageCount)}
          disabled={page >= pageCount}
          aria-label={t("pagination.lastPage")}
        >
          <ChevronsRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
