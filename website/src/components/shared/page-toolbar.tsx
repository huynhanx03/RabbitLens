import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageToolbarProps = {
  ariaLabel: string;
  primary: ReactNode;
  secondary?: ReactNode;
  className?: string;
};

export function PageToolbar({
  ariaLabel,
  primary,
  secondary,
  className,
}: PageToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 flex-1">{primary}</div>
      {secondary ? (
        <div className="flex shrink-0 items-center gap-2">{secondary}</div>
      ) : null}
    </div>
  );
}
