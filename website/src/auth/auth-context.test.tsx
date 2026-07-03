import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "./auth-provider";
import { useAuth } from "./auth-context";
import { createAuthStore } from "./auth-store";

function renderAuth(onLogout = vi.fn()) {
  const store = createAuthStore();

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <AuthProvider store={store} onLogout={onLogout}>
        {children}
      </AuthProvider>
    );
  }

  return {
    store,
    onLogout,
    hook: renderHook(() => useAuth(), { wrapper: Wrapper }),
  };
}

describe("AuthProvider", () => {
  afterEach(() => vi.useRealTimers());

  it("creates Basic and Bearer sessions without retaining passwords", () => {
    const { hook } = renderAuth();

    act(() => hook.result.current.loginBasic("guest", "secret"));

    expect(hook.result.current.session).toEqual({
      type: "basic",
      authorization: "Basic Z3Vlc3Q6c2VjcmV0",
    });
    expect(JSON.stringify(hook.result.current)).not.toContain("secret");

    act(() => hook.result.current.setBearer("access-token"));

    expect(hook.result.current.session).toEqual({
      type: "bearer",
      accessToken: "access-token",
    });
    expect(hook.result.current.user).toBeNull();
  });

  it("logs out when RabbitMQ login session time expires", async () => {
    vi.useFakeTimers();
    const { hook, onLogout } = renderAuth();
    act(() => {
      hook.result.current.loginBasic("guest", "guest");
      hook.result.current.setUser({
        name: "guest",
        tags: ["administrator"],
        loginSessionTimeoutMinutes: 30,
      });
    });

    await act(() => vi.advanceTimersByTimeAsync(30 * 60 * 1_000));

    expect(hook.result.current.session).toEqual({ type: "anonymous" });
    expect(hook.result.current.user).toBeNull();
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("cancels the expiry timer when the provider unmounts", async () => {
    vi.useFakeTimers();
    const { hook, onLogout } = renderAuth();
    act(() => {
      hook.result.current.loginBasic("guest", "guest");
      hook.result.current.setUser({
        name: "guest",
        tags: ["management"],
        loginSessionTimeoutMinutes: 1,
      });
    });

    hook.unmount();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(onLogout).not.toHaveBeenCalled();
  });

  it("clears state and invokes logout cleanup", () => {
    const { hook, onLogout } = renderAuth();
    act(() => hook.result.current.loginBasic("guest", "guest"));

    act(() => hook.result.current.logout());

    expect(hook.result.current.session).toEqual({ type: "anonymous" });
    expect(onLogout).toHaveBeenCalledOnce();
  });
});
