import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/auth/auth-context";

export function AppStatusAnnouncer() {
  const { t } = useTranslation();
  const auth = useAuth();
  const [announcement, setAnnouncement] = useState("");
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((message: string) => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
    setAnnouncement(message);
    clearTimer.current = setTimeout(() => setAnnouncement(""), 3000);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      announce(t("common.reconnected"));
    };

    const handleOffline = () => {
      announce(t("common.offline"));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, [announce, t]);

  useEffect(() => {
    if (auth.session.type === "expired") {
      announce(t("errors.sessionExpired"));
    }
  }, [announce, auth.session.type, t]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
