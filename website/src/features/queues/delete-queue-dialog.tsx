import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { useDeleteQueueMutation } from "@/domains/queues/queue-query";
import { useRouteContext, useNavigate } from "@tanstack/react-router";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { Route } from "@/app/routes/_authenticated/queues/$vhost.$name";

const deleteQueueSchema = z.object({
  ifUnused: z.boolean(),
  ifEmpty: z.boolean(),
});

type DeleteQueueFormValues = z.infer<typeof deleteQueueSchema>;

export interface DeleteQueueDialogProps {
  vhost: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteQueueDialog({
  vhost,
  name,
  open,
  onOpenChange,
}: DeleteQueueDialogProps) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const navigate = useNavigate({ from: Route.fullPath });
  const deleteMutation = useDeleteQueueMutation(context.apiClient);

  const { handleSubmit, setValue, watch } = useForm<DeleteQueueFormValues>({
    resolver: zodResolver(deleteQueueSchema),
    defaultValues: {
      ifUnused: false,
      ifEmpty: false,
    },
  });

  const onSubmit = (data: DeleteQueueFormValues) => {
    deleteMutation.mutate(
      {
        vhost,
        name,
        options: {
          ifUnused: data.ifUnused,
          ifEmpty: data.ifEmpty,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          navigate({
            to: "/queues",
            search: {
              page: 1,
              pageSize: PRODUCT_DEFAULTS.tables.defaultPageSize,
              name: "",
              useRegex: false,
              sortReverse: false,
            },
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("queues.deleteQueue")}</DialogTitle>
          <DialogDescription>
            {t("queues.deleteWarning")} <strong>{name}</strong>
          </DialogDescription>
        </DialogHeader>

        <MutationErrorAlert error={deleteMutation.error} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ifUnused"
                checked={watch("ifUnused")}
                onCheckedChange={(checked: boolean | "indeterminate") => setValue("ifUnused", !!checked)}
                disabled={deleteMutation.isPending}
              />
              <Label htmlFor="ifUnused" className="font-normal">
                {t("queues.deleteIfUnused")}
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ifEmpty"
                checked={watch("ifEmpty")}
                onCheckedChange={(checked: boolean | "indeterminate") => setValue("ifEmpty", !!checked)}
                disabled={deleteMutation.isPending}
              />
              <Label htmlFor="ifEmpty" className="font-normal">
                {t("queues.deleteIfEmpty")}
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={deleteMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("common.loading") : t("common.remove")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
