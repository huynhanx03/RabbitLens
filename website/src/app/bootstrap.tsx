import type { ReactElement } from "react";
import { I18nextProvider } from "react-i18next";
import {
  PRODUCT_DEFAULTS,
  type SupportedLocale,
} from "@/config/defaults";
import { loadRuntimeConfig } from "@/config/runtime-config";
import { RuntimeConfigProvider } from "@/config/runtime-config-provider";
import { createAppI18n } from "@/i18n/i18n";
import { App } from "./app";
import { ConfigurationErrorPage } from "./configuration-error-page";
import { ThemeProvider } from "./providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

function getStoredLocale(): SupportedLocale | null {
  const locale = localStorage.getItem(PRODUCT_DEFAULTS.persistenceKeys.locale);
  return locale === "en" || locale === "vi" ? locale : null;
}

function getBrowserLocale(): SupportedLocale {
  return navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
}

export async function createApplication(
  fetcher: typeof fetch = fetch,
): Promise<ReactElement> {
  const storedLocale = getStoredLocale();
  const i18n = await createAppI18n(storedLocale ?? getBrowserLocale());

  try {
    const config = await loadRuntimeConfig(fetcher);

    if (!storedLocale) {
      await i18n.changeLanguage(config.defaultLocale);
    }

    return (
      <I18nextProvider i18n={i18n}>
        <RuntimeConfigProvider config={config}>
          <ThemeProvider defaultPreference={config.defaultTheme}>
            <App />
            <Toaster closeButton richColors />
          </ThemeProvider>
        </RuntimeConfigProvider>
      </I18nextProvider>
    );
  } catch {
    return (
      <I18nextProvider i18n={i18n}>
        <ConfigurationErrorPage />
      </I18nextProvider>
    );
  }
}
