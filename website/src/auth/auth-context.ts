import { createContext, useContext } from "react";
import type { AuthenticatedUser, AuthState } from "./auth-session";

export type AuthContextValue = AuthState & {
  loginBasic: (username: string, password: string) => void;
  setBearer: (accessToken: string) => void;
  setRestoringOAuth: () => void;
  setExpiring: (accessToken: string) => void;
  setExpired: () => void;
  setUser: (user: AuthenticatedUser) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("AuthProvider is missing");
  }

  return auth;
}
