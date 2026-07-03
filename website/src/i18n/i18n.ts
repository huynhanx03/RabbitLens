import i18next, { type i18n } from "i18next";
import { initReactI18next } from "react-i18next";
import {
  PRODUCT_DEFAULTS,
  type SupportedLocale,
} from "@/config/defaults";
import { resources } from "./resources";

export async function createAppI18n(
  defaultLocale: SupportedLocale,
): Promise<i18n> {
  const storedLocale = localStorage.getItem(
    PRODUCT_DEFAULTS.persistenceKeys.locale,
  );
  const initialLocale =
    storedLocale === "vi" || storedLocale === "en"
      ? storedLocale
      : defaultLocale;
  const instance = i18next.createInstance();

  await instance.use(initReactI18next).init({
    resources,
    lng: initialLocale,
    fallbackLng: PRODUCT_DEFAULTS.locale,
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  instance.on("languageChanged", (locale) => {
    if (locale === "en" || locale === "vi") {
      localStorage.setItem(PRODUCT_DEFAULTS.persistenceKeys.locale, locale);
      document.documentElement.lang = locale;
    }
  });

  document.documentElement.lang = initialLocale;
  return instance;
}
