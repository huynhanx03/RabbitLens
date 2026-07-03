import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PRODUCT_DEFAULTS, type ThemePreference } from "@/config/defaults";
import { useTheme } from "./theme-context";
import { ThemeProvider } from "./theme-provider";

class MatchMediaMock {
  matches: boolean;
  readonly media = "(prefers-color-scheme: dark)";
  readonly addEventListener = vi.fn(
    (_type: "change", listener: (event: MediaQueryListEvent) => void) => {
      this.listeners.add(listener);
    },
  );
  readonly removeEventListener = vi.fn(
    (_type: "change", listener: (event: MediaQueryListEvent) => void) => {
      this.listeners.delete(listener);
    },
  );
  private readonly listeners = new Set<
    (event: MediaQueryListEvent) => void
  >();

  constructor(matches: boolean) {
    this.matches = matches;
  }

  dispatch(matches: boolean) {
    this.matches = matches;
    const event = { matches, media: this.media } as MediaQueryListEvent;
    this.listeners.forEach((listener) => listener(event));
  }
}

function renderTheme(defaultPreference: ThemePreference, systemDark = false) {
  const media = new MatchMediaMock(systemDark);
  vi.spyOn(window, "matchMedia").mockReturnValue(
    media as unknown as MediaQueryList,
  );

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <ThemeProvider defaultPreference={defaultPreference}>
        {children}
      </ThemeProvider>
    );
  }

  return {
    media,
    hook: renderHook(() => useTheme(), { wrapper: Wrapper }),
  };
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light", "dark", "system");
    vi.restoreAllMocks();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  });

  it.each([
    ["light", "light"],
    ["dark", "dark"],
  ] as const)("applies the explicit %s theme", (preference, resolvedTheme) => {
    const { hook } = renderTheme(preference);

    expect(hook.result.current.preference).toBe(preference);
    expect(hook.result.current.resolvedTheme).toBe(resolvedTheme);
    expect(document.documentElement).toHaveClass(resolvedTheme);
    expect(document.documentElement).not.toHaveClass("system");
  });

  it("resolves the system preference and follows media changes", () => {
    const { hook, media } = renderTheme("system", true);

    expect(hook.result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");

    act(() => media.dispatch(false));

    expect(hook.result.current.resolvedTheme).toBe("light");
    expect(document.documentElement).toHaveClass("light");
    expect(document.documentElement).not.toHaveClass("dark", "system");
  });

  it("prefers a valid stored preference and persists changes", () => {
    localStorage.setItem(PRODUCT_DEFAULTS.persistenceKeys.theme, "dark");
    const { hook } = renderTheme("light");

    expect(hook.result.current.preference).toBe("dark");

    act(() => hook.result.current.setPreference("light"));

    expect(localStorage.getItem(PRODUCT_DEFAULTS.persistenceKeys.theme)).toBe(
      "light",
    );
    expect(document.documentElement).toHaveClass("light");
  });

  it("ignores an invalid stored preference", () => {
    localStorage.setItem(PRODUCT_DEFAULTS.persistenceKeys.theme, "sepia");

    const { hook } = renderTheme("dark");

    expect(hook.result.current.preference).toBe("dark");
  });

  it("subscribes only in system mode and cleans up on unmount", () => {
    const { hook, media } = renderTheme("system");
    const registeredListener = media.addEventListener.mock.calls[0]?.[1];

    expect(media.addEventListener).toHaveBeenCalledOnce();
    hook.unmount();

    expect(media.removeEventListener).toHaveBeenCalledWith(
      "change",
      registeredListener,
    );
  });
});
