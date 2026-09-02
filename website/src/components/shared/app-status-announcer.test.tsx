import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/auth/auth-provider";
import { createAuthStore } from "@/auth/auth-store";
import { AppStatusAnnouncer } from "./app-status-announcer";

function renderAnnouncer() {
  const store = createAuthStore();
  const rendered = render(
    <AuthProvider store={store} onLogout={vi.fn()}>
      <AppStatusAnnouncer />
    </AuthProvider>,
  );
  return { ...rendered, store };
}

describe("AppStatusAnnouncer", () => {
  afterEach(() => vi.useRealTimers());

  it("announces offline and reconnected browser states, clearing stale status", () => {
    vi.useFakeTimers();
    renderAnnouncer();

    act(() => window.dispatchEvent(new Event("offline")));
    expect(screen.getByRole("status")).toHaveTextContent("You are offline");

    act(() => window.dispatchEvent(new Event("online")));
    expect(screen.getByRole("status")).toHaveTextContent("Connection restored");

    act(() => vi.advanceTimersByTime(3_000));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("announces an expired session when the auth store transitions", () => {
    const { store } = renderAnnouncer();

    act(() => store.setSession({ type: "expired" }));

    expect(screen.getByRole("status")).toHaveTextContent("Your session has expired");
  });
});
