import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ApiError } from "@/api/api-error";
import { useTranslation } from "react-i18next";

export interface MutationErrorAlertProps {
  error: unknown | null;
}

export function MutationErrorAlert({ error }: MutationErrorAlertProps) {
  const { t } = useTranslation();

  if (!error) return null;

  let title = t("common.error");
  let description = t("common.unexpectedError");

  if (error instanceof ApiError) {
    title = error.kind === "validation" ? t("common.validationError") : t("common.apiError");
    description = error.message;
  } else if (error instanceof Error) {
    description = error.message;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="break-all">{description}</AlertDescription>
    </Alert>
  );
}
