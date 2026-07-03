import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/app/providers/theme-context";
import type { ThemePreference } from "@/config/defaults";

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const { t } = useTranslation();
  const TriggerIcon =
    preference === "light" ? Sun : preference === "dark" ? Moon : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl border border-border/70 bg-background/80 shadow-xs hover:border-border hover:bg-accent"
        >
          <TriggerIcon className="size-[1.125rem]" aria-hidden="true" />
          <span className="sr-only">{t("common.theme")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) =>
            setPreference(value as ThemePreference)
          }
        >
          <DropdownMenuRadioItem value="light" className="gap-2 px-2 py-1.5 whitespace-nowrap">
            <Sun data-testid="theme-option-light-icon" aria-hidden="true" />
            {t("common.light")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="gap-2 px-2 py-1.5 whitespace-nowrap">
            <Moon data-testid="theme-option-dark-icon" aria-hidden="true" />
            {t("common.dark")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" className="gap-2 px-2 py-1.5 whitespace-nowrap">
            <Monitor data-testid="theme-option-system-icon" aria-hidden="true" />
            {t("common.system")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
