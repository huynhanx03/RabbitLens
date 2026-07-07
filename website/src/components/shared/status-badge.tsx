import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, AlertCircle, HelpCircle } from "lucide-react";
import { type ReactNode } from "react";

export type StatusVariant = "success" | "warning" | "error" | "info" | "unknown";

interface StatusBadgeProps {
  variant: StatusVariant;
  children: ReactNode;
  className?: string;
  icon?: boolean;
}

export function StatusBadge({
  variant,
  children,
  className,
  icon = true,
}: StatusBadgeProps) {
  const icons: Record<StatusVariant, ReactNode> = {
    success: <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />,
    warning: <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />,
    error: <XCircle className="mr-1.5 h-3.5 w-3.5" />,
    info: <AlertCircle className="mr-1.5 h-3.5 w-3.5" />,
    unknown: <HelpCircle className="mr-1.5 h-3.5 w-3.5" />,
  };

  return (
    <span
      data-variant={variant}
      className={cn(
        "rl-status-badge inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        className
      )}
    >
      {icon && <span aria-hidden="true">{icons[variant]}</span>}
      <span className="sr-only">{variant}: </span>
      {children}
    </span>
  );
}
