import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type CapabilityUnavailableProps = {
  reason: "not-installed" | "forbidden" | "discovery-failed";
};

export function CapabilityUnavailable({ reason }: CapabilityUnavailableProps) {
  const { t } = useTranslation();
  const descriptionKey = reason === "not-installed"
    ? "extensions.notEnabled"
    : reason === "forbidden"
      ? "extensions.accessDenied"
      : "extensions.unavailableDesc";

  return (
    <Alert variant={reason === "discovery-failed" ? "destructive" : "default"}>
      <AlertCircle aria-hidden="true" />
      <AlertTitle>{t("extensions.unavailable")}</AlertTitle>
      <AlertDescription>{t(descriptionKey)}</AlertDescription>
    </Alert>
  );
}
