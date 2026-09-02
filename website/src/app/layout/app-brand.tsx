import { cn } from "@/lib/utils";
import { BrandLogo } from "@/brand/brand-logo";

export function AppBrand({ compact = false }: { compact?: boolean }) {
  return (
    <BrandLogo
      variant={compact ? "mark" : "lockup"}
      className={cn("min-w-0", compact && "justify-center")}
    />
  );
}
