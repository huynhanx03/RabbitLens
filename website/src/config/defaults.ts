export const PRODUCT_DEFAULTS = {
  locale: "en",
  theme: "system",
  persistenceKeys: {
    locale: "rabbitlens.locale",
    theme: "rabbitlens.theme",
  },
  requests: {
    timeoutMs: 15_000,
    retryCount: 2,
    retryBaseDelayMs: 1_000,
  },
  polling: {
    overviewMs: 5_000,
    nodeDetailsMs: 5_000,
    heavyListsMs: 15_000,
  },
  tables: {
    defaultPageSize: 100,
  },
  charts: {
    defaultRangeSeconds: 60,
  },
} as const;

export type SupportedLocale = "en" | "vi";
export type ThemePreference = "light" | "dark" | "system";
