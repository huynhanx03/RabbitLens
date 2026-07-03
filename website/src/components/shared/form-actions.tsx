import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

type FormActionsProps = {
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
  onCancel: () => void;
  submitDisabled?: boolean;
};

export function FormActions({
  isPending,
  submitLabel,
  pendingLabel,
  onCancel,
  submitDisabled = false,
}: FormActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isPending}
      >
        {t("common.cancel")}
      </Button>
      <Button type="submit" disabled={isPending || submitDisabled}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </div>
  );
}
