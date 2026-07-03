import { Boxes } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function AppBrand({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Boxes className="size-4.5" aria-hidden="true" />
      </span>
      <span
        className={cn(
          "truncate text-sm font-semibold tracking-tight",
          compact && "sr-only",
        )}
      >
        {t("common.appName")}
      </span>
    </div>
  );
}
