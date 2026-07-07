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
        "rl-toolbar flex flex-col gap-4 border-0 bg-transparent p-0 shadow-none sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 flex-1">{primary}</div>
      {secondary ? (
        <div className="flex shrink-0 items-center gap-3 sm:ml-auto">
          {secondary}
        </div>
      ) : null}
    </div>
  );
}
