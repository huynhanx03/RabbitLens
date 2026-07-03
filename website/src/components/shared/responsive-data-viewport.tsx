import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ResponsiveDataViewportProps = {
  children: ReactNode;
  className?: string;
};

export function ResponsiveDataViewport({
  children,
  className,
}: ResponsiveDataViewportProps) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="min-w-full">{children}</div>
    </div>
  );
}
