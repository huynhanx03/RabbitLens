import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DetailPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  backAction?: ReactNode;
  status?: ReactNode;
  metadata?: ReactNode[];
  actions?: ReactNode;
  className?: string;
};

export function DetailPageHeader({
  title,
  description,
  backAction,
  status,
  metadata = [],
  actions,
  className,
}: DetailPageHeaderProps) {
  return (
    <header
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {backAction ? <div className="shrink-0">{backAction}</div> : null}
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="min-w-0 break-words text-2xl font-bold tracking-tight sm:text-3xl">
                {title}
              </h1>
              {status}
            </div>
            {description ? (
              <p className="text-sm text-muted-foreground sm:text-base">
                {description}
              </p>
            ) : null}
            {metadata.length ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {metadata.map((item, index) => (
                  <span key={index}>{item}</span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
