import {
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import { createBasicAuthorization } from "./basic-auth";
import { AuthContext, type AuthContextValue } from "./auth-context";
import type { AuthenticatedUser } from "./auth-session";
import type { AuthStore } from "./auth-store";

const MILLISECONDS_PER_MINUTE = 60_000;

type AuthProviderProps = PropsWithChildren<{
  store: AuthStore;
  onLogout: () => void;
}>;

export function AuthProvider({
  store,
  onLogout,
  children,
}: AuthProviderProps) {
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  const loginBasic = useCallback(
    (username: string, password: string) => {
      store.setSession({
        type: "basic",
        authorization: createBasicAuthorization(username, password),
      });
    },
    [store],
  );

  const setBearer = useCallback(
    (accessToken: string) => {
      store.setSession({ type: "bearer", accessToken });
    },
    [store],
  );

  const setRestoringOAuth = useCallback(() => {
    store.setSession({ type: "restoring_oauth" });
  }, [store]);

  const setExpiring = useCallback((accessToken: string) => {
    store.setSession({ type: "expiring", accessToken });
  }, [store]);

  const setExpired = useCallback(() => {
    store.setSession({ type: "expired" });
  }, [store]);

  const setUser = useCallback(
    (user: AuthenticatedUser) => {
      store.setUser(user);
    },
    [store],
  );

  const logout = useCallback(() => {
    store.clear();
    onLogout();
  }, [onLogout, store]);

  useEffect(() => {
    const timeoutMinutes = state.user?.loginSessionTimeoutMinutes;
    if (!timeoutMinutes || timeoutMinutes <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(
      logout,
      timeoutMinutes * MILLISECONDS_PER_MINUTE,
    );
    return () => window.clearTimeout(timeoutId);
  }, [logout, state.user?.loginSessionTimeoutMinutes]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, loginBasic, setBearer, setRestoringOAuth, setExpiring, setExpired, setUser, logout }),
    [state, loginBasic, setBearer, setRestoringOAuth, setExpiring, setExpired, setUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
