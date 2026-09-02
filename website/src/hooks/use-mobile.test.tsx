import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile", () => {
  afterEach(() => vi.restoreAllMocks());

  it("tracks the shared 768px breakpoint and removes its media listener", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      addEventListener,
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: true,
      media: "(max-width: 767px)",
      onchange: null,
      removeListener: vi.fn(),
      removeEventListener,
    });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 767, writable: true });

    const { result, unmount } = renderHook(useIsMobile);
    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 768, writable: true });
    act(() => addEventListener.mock.calls[0][1]());
    expect(result.current).toBe(false);

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith("change", addEventListener.mock.calls[0][1]);
  });
});
