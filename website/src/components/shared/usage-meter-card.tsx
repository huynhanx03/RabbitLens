import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type UsageMeterCardProps = {
  title: ReactNode;
  value: ReactNode;
  limit?: ReactNode;
  percent?: number | null;
  icon?: ReactNode;
  status?: "normal" | "warning" | "critical";
  footer?: ReactNode;
  className?: string;
};

export function UsageMeterCard({
  title,
  value,
  limit,
  percent,
  icon,
  status = "normal",
  footer,
  className,
}: UsageMeterCardProps) {
  const safePercent =
    typeof percent === "number" ? Math.min(100, Math.max(0, percent)) : null;

  return (
    <article
      className={cn(
        "rounded-2xl border border-border/70 bg-background/35 p-4 shadow-sm",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-background/50",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
            <span
              className={cn(
                "text-2xl font-bold tracking-tight text-foreground",
                status === "warning" && "text-warning",
                status === "critical" && "text-destructive",
              )}
            >
              {value ?? "—"}
            </span>
            {limit ? (
              <span className="text-xs font-medium text-muted-foreground">
                / {limit}
              </span>
            ) : null}
          </div>
        </div>
        {icon ? (
          <span className="rl-icon-tile flex size-10 shrink-0 items-center justify-center rounded-xl text-primary [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
      </div>

      {safePercent !== null ? (
        <div className="mt-4 space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full bg-primary transition-[width] duration-500",
                status === "warning" && "bg-warning",
                status === "critical" && "bg-destructive",
              )}
              style={{ width: `${safePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{safePercent.toFixed(safePercent >= 10 ? 0 : 1)}%</span>
            {footer ? <span>{footer}</span> : null}
          </div>
        </div>
      ) : footer ? (
        <p className="mt-4 text-xs text-muted-foreground">{footer}</p>
      ) : null}
    </article>
  );
}
