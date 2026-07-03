import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type MetricStatus = "normal" | "warning" | "critical" | "inactive";

interface MetricCardProps {
  title: string;
  value: string | number | null;
  unit?: string;
  status?: MetricStatus;
  isLoading?: boolean;
  isUnavailable?: boolean;
  unavailableLabel?: string;
  className?: string;
  icon?: ReactNode;
  description?: string;
  statusLabel?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  status = "normal",
  isLoading = false,
  isUnavailable = false,
  unavailableLabel = "—",
  className,
  icon,
  description,
  statusLabel,
}: MetricCardProps) {
  const statusColors = {
    normal: "text-foreground",
    warning: "text-amber-500 dark:text-amber-400",
    critical: "text-destructive",
    inactive: "text-muted-foreground",
  };

  return (
    <Card
      role="region"
      aria-label={title}
      className={cn(
        "group overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon ? (
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
      </CardHeader>
      <CardContent>
        {isUnavailable ? (
          <div className="text-2xl font-bold text-muted-foreground opacity-50">
            {unavailableLabel}
          </div>
        ) : isLoading ? (
          <Skeleton className="h-8 w-1/2" />
        ) : (
          <div className="flex items-baseline space-x-1">
            <div className={cn("text-2xl font-bold", statusColors[status])}>
              {value ?? "—"}
            </div>
            {statusLabel ? <span className="sr-only">{statusLabel}</span> : null}
            {unit && (
              <span className="text-xs text-muted-foreground font-medium">
                {unit}
              </span>
            )}
          </div>
        )}
        {description ? (
          <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
