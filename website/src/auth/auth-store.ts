import type {
  AuthenticatedUser,
  AuthSession,
  AuthState,
} from "./auth-session";

export type AuthStore = {
  getSnapshot: () => AuthState;
  subscribe: (listener: () => void) => () => void;
  setSession: (session: AuthSession) => void;
  setUser: (user: AuthenticatedUser) => void;
  clear: () => void;
};

const ANONYMOUS_STATE: AuthState = {
  session: { type: "anonymous" },
  user: null,
};

export function createAuthStore(): AuthStore {
  let state = ANONYMOUS_STATE;
  const listeners = new Set<() => void>();

  const publish = (nextState: AuthState) => {
    state = nextState;
    listeners.forEach((listener) => listener());
  };

  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setSession: (session) => {
      publish({ session, user: null });
    },
    setUser: (user) => publish({ ...state, user }),
    clear: () => publish(ANONYMOUS_STATE),
  };
}
