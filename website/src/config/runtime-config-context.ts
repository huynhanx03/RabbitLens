import { createContext, useContext } from "react";
import type { RuntimeConfig } from "./runtime-config-schema";

export const RuntimeConfigContext = createContext<RuntimeConfig | null>(null);

export function useRuntimeConfig(): RuntimeConfig {
  const config = useContext(RuntimeConfigContext);

  if (!config) {
    throw new Error("RuntimeConfigProvider is missing");
  }

  return config;
}
