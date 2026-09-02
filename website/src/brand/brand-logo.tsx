import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant?: "mark" | "lockup";
} & Omit<ComponentProps<"div">, "children">;

export function BrandLogo({ variant = "lockup", className, ...props }: BrandLogoProps) {
  const isMark = variant === "mark";

  return (
    <div
      {...props}
      className={cn("inline-flex items-center gap-2.5", className)}
      role="img"
      aria-label="RabbitLens"
    >
      <svg aria-hidden="true" className="size-8 shrink-0" viewBox="0 0 80 80" fill="none">
        <path
          d="M21 45c8-17 30-17 38 0"
          className="stroke-primary"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M28 30l5-13 6 11M48 28l6-11 5 13"
          className="stroke-primary"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="40" cy="47" r="11" className="fill-brand-lens" />
        <circle cx="40" cy="47" r="5" className="fill-background" />
      </svg>
      {!isMark ? (
        <span className="truncate text-sm font-semibold tracking-tight">RabbitLens</span>
      ) : null}
    </div>
  );
}
