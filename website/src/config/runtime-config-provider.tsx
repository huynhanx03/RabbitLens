import type { PropsWithChildren } from "react";
import { RuntimeConfigContext } from "./runtime-config-context";
import type { RuntimeConfig } from "./runtime-config-schema";

type RuntimeConfigProviderProps = PropsWithChildren<{
  config: RuntimeConfig;
}>;

export function RuntimeConfigProvider({
  config,
  children,
}: RuntimeConfigProviderProps) {
  return (
    <RuntimeConfigContext.Provider value={config}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}
