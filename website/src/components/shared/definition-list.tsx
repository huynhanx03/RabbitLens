import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DefinitionItem = {
  label: ReactNode;
  value: ReactNode | null | undefined;
};

type DefinitionListProps = {
  className?: string;
  items: readonly DefinitionItem[];
  unavailableLabel: ReactNode;
};

export function DefinitionList({
  className,
  items,
  unavailableLabel,
}: DefinitionListProps) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-3 sm:grid-cols-2", className)}>
      {items.map((item, index) => (
        <div key={index} className="min-w-0 border-b pb-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1 break-words text-sm font-medium">
            {item.value ?? unavailableLabel}
          </dd>
        </div>
      ))}
    </dl>
  );
}
