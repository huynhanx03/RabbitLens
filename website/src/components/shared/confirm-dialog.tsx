import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MutationErrorAlert } from "./mutation-error-alert";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  onConfirm: () => void;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  variant?: "default" | "destructive";
  isConfirming?: boolean;
  error?: unknown | null;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText,
  cancelText,
  variant = "default",
  isConfirming = false,
  error = null,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <MutationErrorAlert error={error} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>
            {cancelText || t("common.cancel")}
          </AlertDialogCancel>
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? t("common.loading") : confirmText || t("common.confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
