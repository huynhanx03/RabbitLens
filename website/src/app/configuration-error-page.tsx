import { CircleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ConfigurationErrorPage() {
  const { t } = useTranslation();

  return (
    <main className="grid min-h-svh place-items-center bg-background p-6 text-foreground">
      <Alert variant="destructive" className="max-w-lg">
        <CircleAlert aria-hidden="true" />
        <AlertTitle>
          <h1>{t("errors.configurationTitle")}</h1>
        </AlertTitle>
        <AlertDescription>
          {t("errors.configurationDescription")}
        </AlertDescription>
      </Alert>
    </main>
  );
}
