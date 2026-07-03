import { createContext, useContext } from "react";
import type { ThemePreference } from "@/config/defaults";

export type ResolvedTheme = Exclude<ThemePreference, "system">;

export type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error("ThemeProvider is missing");
  }

  return theme;
}
