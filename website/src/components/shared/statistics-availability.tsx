import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StatisticsAvailabilityProps {
  reason?: string;
}

export function StatisticsAvailability({ reason }: StatisticsAvailabilityProps) {
  const { t } = useTranslation();

  if (!reason) {
    return null;
  }

  return (
    <Alert variant="default" className="bg-muted/50">
      <Info className="h-4 w-4" />
      <AlertTitle>{t("common.statisticsUnavailable", "Statistics Unavailable")}</AlertTitle>
      <AlertDescription>{reason}</AlertDescription>
    </Alert>
  );
}
