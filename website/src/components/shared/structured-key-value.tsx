import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StructuredKeyValueEntry = {
  key: ReactNode;
  value: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "accent";
  monospace?: boolean;
};

type StructuredKeyValueProps = {
  entries: StructuredKeyValueEntry[];
  emptyLabel?: ReactNode;
  className?: string;
};

export function StructuredKeyValue({
  entries,
  emptyLabel = "—",
  className,
}: StructuredKeyValueProps) {
  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <dl className={cn("grid gap-2", className)}>
      {entries.map((entry, index) => (
        <div
          key={index}
          className="grid gap-2 rounded-xl border border-border/60 bg-background/35 px-3 py-2.5 sm:grid-cols-[minmax(10rem,0.42fr)_1fr] sm:items-start"
        >
          <dt className="min-w-0 break-words text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {entry.key}
          </dt>
          <dd
            className={cn(
              "min-w-0 break-words text-sm font-medium text-foreground",
              entry.monospace && "font-mono",
              entry.tone === "success" && "text-success",
              entry.tone === "warning" && "text-warning",
              entry.tone === "danger" && "text-destructive",
              entry.tone === "accent" && "text-primary",
            )}
          >
            {entry.value === null || entry.value === undefined || entry.value === ""
              ? emptyLabel
              : entry.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
