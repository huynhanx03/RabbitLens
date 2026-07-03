import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";
import { useRuntimeConfig } from "./runtime-config-context";
import { RuntimeConfigProvider } from "./runtime-config-provider";
import type { RuntimeConfig } from "./runtime-config-schema";

const config: RuntimeConfig = {
  apiBaseUrl: "/api",
  auth: { basic: true, oauth: null },
  defaultLocale: "en",
  defaultTheme: "system",
};

describe("RuntimeConfigProvider", () => {
  it("provides one validated runtime configuration", () => {
    function Wrapper({ children }: PropsWithChildren) {
      return (
        <RuntimeConfigProvider config={config}>
          {children}
        </RuntimeConfigProvider>
      );
    }

    const { result } = renderHook(() => useRuntimeConfig(), {
      wrapper: Wrapper,
    });

    expect(result.current).toBe(config);
  });

  it("fails clearly outside its provider", () => {
    expect(() => renderHook(() => useRuntimeConfig())).toThrow(
      "RuntimeConfigProvider is missing",
    );
  });
});
