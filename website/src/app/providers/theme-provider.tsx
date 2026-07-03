import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  PRODUCT_DEFAULTS,
  type ThemePreference,
} from "@/config/defaults";
import {
  ThemeContext,
  type ResolvedTheme,
  type ThemeContextValue,
} from "./theme-context";

const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_MODE_QUERY).matches ? "dark" : "light";
}

type ThemeProviderProps = PropsWithChildren<{
  defaultPreference: ThemePreference;
}>;

export function ThemeProvider({
  defaultPreference,
  children,
}: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    const storedPreference = localStorage.getItem(
      PRODUCT_DEFAULTS.persistenceKeys.theme,
    );
    return isThemePreference(storedPreference)
      ? storedPreference
      : defaultPreference;
  });
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    preference === "system" ? getSystemTheme() : "light",
  );
  const resolvedTheme = preference === "system" ? systemTheme : preference;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "system");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    if (preference !== "system") {
      return;
    }

    const media = window.matchMedia(DARK_MODE_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    setSystemTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [preference]);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    localStorage.setItem(
      PRODUCT_DEFAULTS.persistenceKeys.theme,
      nextPreference,
    );
    setPreferenceState(nextPreference);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
