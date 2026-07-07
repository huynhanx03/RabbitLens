import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FormFieldRowProps {
  children: ReactNode;
  label: ReactNode;
  htmlFor?: string;
  error?: ReactNode;
  className?: string;
  controlClassName?: string;
  labelClassName?: string;
}

export function FormFieldRow({
  children,
  label,
  htmlFor,
  error,
  className,
  controlClassName,
  labelClassName,
}: FormFieldRowProps) {
  return (
    <div
      className={cn(
        "grid gap-2 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center",
        className
      )}
    >
      <Label
        htmlFor={htmlFor}
        className={cn(
          "text-sm font-semibold text-muted-foreground sm:pt-0.5",
          labelClassName
        )}
      >
        {label}
      </Label>
      <div className={cn("min-w-0 space-y-1.5", controlClassName)}>
        {children}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
