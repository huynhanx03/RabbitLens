import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DetailGridItem = {
  label: ReactNode;
  value: ReactNode;
  monospace?: boolean;
  className?: string;
};

type DetailGridProps = {
  items: DetailGridItem[];
  unavailableLabel?: ReactNode;
  className?: string;
};

export function DetailGrid({
  items,
  unavailableLabel = "—",
  className,
}: DetailGridProps) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {items.map((item, index) => (
        <div key={index} className={cn("min-w-0 space-y-1", item.className)}>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </dt>
          <dd
            className={cn(
              "break-words text-sm font-medium text-foreground",
              item.monospace && "font-mono",
            )}
          >
            {item.value === null || item.value === undefined || item.value === ""
              ? unavailableLabel
              : item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
