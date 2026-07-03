import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ConnectivityBanner() {
  const { t } = useTranslation();
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <Alert role="alert" className="mx-(--page-gutter) mt-4 rounded-xl border-warning/40 bg-warning/10">
      <WifiOff aria-hidden="true" />
      <AlertTitle>{t("common.offline")}</AlertTitle>
      <AlertDescription>{t("common.offlineDescription")}</AlertDescription>
    </Alert>
  );
}
