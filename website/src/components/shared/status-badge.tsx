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
  const styles: Record<StatusVariant, string> = {
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900/50",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
    unknown: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  };

  const icons: Record<StatusVariant, ReactNode> = {
    success: <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />,
    warning: <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />,
    error: <XCircle className="mr-1.5 h-3.5 w-3.5" />,
    info: <AlertCircle className="mr-1.5 h-3.5 w-3.5" />,
    unknown: <HelpCircle className="mr-1.5 h-3.5 w-3.5" />,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        styles[variant],
        className
      )}
    >
      {icon && <span aria-hidden="true">{icons[variant]}</span>}
      <span className="sr-only">{variant}: </span>
      {children}
    </span>
  );
}
