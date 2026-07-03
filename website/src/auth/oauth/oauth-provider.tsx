import React, { createContext, useContext, useEffect, useRef } from "react";
import type { OAuthManager } from "./oauth-manager";
import { useAuth } from "../auth-context";
import { useRuntimeConfig } from "@/config/runtime-config-context";

export const OAuthContext = createContext<OAuthManager | null>(null);

export function useOAuthManager(): OAuthManager {
  const context = useContext(OAuthContext);
  if (!context) {
    throw new Error("useOAuthManager must be used within an OAuthProvider");
  }
  return context;
}

export function OAuthProvider({
  manager,
  children,
}: {
  manager: OAuthManager;
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const authRef = useRef(auth);
  authRef.current = auth;
  const config = useRuntimeConfig();
  const hasOAuth = !!config.auth.oauth;

  useEffect(() => {
    if (!hasOAuth) return;

    // Handle restore
    auth.setRestoringOAuth();
    manager.restore().then((user) => {
      const currentAuth = authRef.current;
      const restoreIsActive = currentAuth.session.type === "anonymous"
        || currentAuth.session.type === "restoring_oauth";
      if (!restoreIsActive) return;
      if (user && user.access_token && !user.expired) {
        currentAuth.setBearer(user.access_token);
      } else {
        currentAuth.logout();
      }
    }).catch(() => {
      console.warn("Failed to restore OAuth session");
      if (authRef.current.session.type === "restoring_oauth") {
        authRef.current.logout();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager, hasOAuth]);

  useEffect(() => {
    if (!hasOAuth) return;

    const unsubscribe = manager.subscribe(
      (user) => {
        if (user.access_token) {
          auth.setBearer(user.access_token);
        }
      },
      () => {
        auth.logout();
      },
      () => {
        // Access token expiring
        if (auth.session.type === "bearer") {
          auth.setExpiring(auth.session.accessToken);
        }
      },
      () => {
        // Access token expired
        auth.setExpired();
      },
      () => {
        console.warn("Silent OAuth renewal failed");
      }
    );

    return unsubscribe;
  }, [manager, auth, hasOAuth]);

  return (
    <OAuthContext.Provider value={manager}>
      {children}
    </OAuthContext.Provider>
  );
}
