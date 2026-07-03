import { describe, expect, it, vi } from "vitest";
import { createAuthStore } from "./auth-store";

describe("createAuthStore", () => {
  it("keeps authentication state in memory and notifies subscribers", () => {
    const store = createAuthStore();
    const subscriber = vi.fn();
    const unsubscribe = store.subscribe(subscriber);

    expect(store.getSnapshot()).toEqual({
      session: { type: "anonymous" },
      user: null,
    });

    store.setSession({ type: "basic", authorization: "Basic value" });
    store.setUser({ name: "operator", tags: ["monitoring"] });

    expect(store.getSnapshot()).toEqual({
      session: { type: "basic", authorization: "Basic value" },
      user: { name: "operator", tags: ["monitoring"] },
    });
    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(store.getSnapshot())).not.toContain("password");

    unsubscribe();
    store.clear();

    expect(store.getSnapshot()).toEqual({
      session: { type: "anonymous" },
      user: null,
    });
    expect(subscriber).toHaveBeenCalledTimes(2);
  });

  it("clears the session and user together", () => {
    const store = createAuthStore();
    store.setSession({ type: "bearer", accessToken: "token" });
    store.setUser({
      name: "admin",
      tags: ["administrator"],
      loginSessionTimeoutMinutes: 30,
    });

    store.clear();

    expect(store.getSnapshot()).toEqual({
      session: { type: "anonymous" },
      user: null,
    });
  });

  it("clears the previous user when a new session starts", () => {
    const store = createAuthStore();
    store.setSession({ type: "basic", authorization: "Basic first" });
    store.setUser({ name: "first", tags: ["management"] });

    store.setSession({ type: "bearer", accessToken: "second" });

    expect(store.getSnapshot()).toEqual({
      session: { type: "bearer", accessToken: "second" },
      user: null,
    });
  });
});
