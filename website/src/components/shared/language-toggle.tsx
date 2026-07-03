import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SupportedLocale } from "@/config/defaults";

const LOCALE_PRESENTATION: Record<
  SupportedLocale,
  { flag: string; label: string; code: string }
> = {
  en: { flag: "🇬🇧", label: "English", code: "EN" },
  vi: { flag: "🇻🇳", label: "Tiếng Việt", code: "VI" },
};

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const language: SupportedLocale =
    i18n.resolvedLanguage === "vi" ? "vi" : "en";
  const activeLocale = LOCALE_PRESENTATION[language];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl border border-border/70 bg-background/80 shadow-xs hover:border-border hover:bg-accent"
        >
          <span
            data-testid="language-trigger-flag"
            className="text-base leading-none"
            aria-hidden="true"
          >
            {activeLocale.flag}
          </span>
          <span className="sr-only">{t("common.language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuRadioGroup
          value={language}
          onValueChange={(value) =>
            void i18n.changeLanguage(value as SupportedLocale)
          }
        >
          {(Object.entries(LOCALE_PRESENTATION) as Array<
            [SupportedLocale, (typeof LOCALE_PRESENTATION)[SupportedLocale]]
          >).map(([locale, presentation]) => (
            <DropdownMenuRadioItem
              key={locale}
              value={locale}
              className="gap-2 px-2 py-1.5 whitespace-nowrap"
            >
              <span className="text-base leading-none" aria-hidden="true">
                {presentation.flag}
              </span>
              <span>{presentation.label}</span>
              <span
                className="ml-auto pr-1 text-[0.6875rem] font-semibold tracking-wider text-muted-foreground"
                aria-hidden="true"
              >
                {presentation.code}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
