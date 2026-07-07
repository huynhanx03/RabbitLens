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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArgumentsEditor, type ArgumentValue } from "@/components/shared/arguments-editor";
import { FormFieldRow } from "@/components/shared/form-field-row";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { useCreateExchangeMutation } from "@/domains/exchanges/exchange-query";
import { useRouteContext } from "@tanstack/react-router";

const createExchangeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  durable: z.boolean(),
  auto_delete: z.boolean(),
  internal: z.boolean(),
  arguments: z.record(z.string(), z.unknown()),
});

type CreateExchangeFormValues = z.infer<typeof createExchangeSchema>;

export interface CreateExchangeDialogProps {
  vhost: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateExchangeDialog({
  vhost,
  open,
  onOpenChange,
}: CreateExchangeDialogProps) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const createMutation = useCreateExchangeMutation(context.apiClient);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateExchangeFormValues>({
    resolver: zodResolver(createExchangeSchema),
    defaultValues: {
      name: "",
      type: "direct",
      durable: true,
      auto_delete: false,
      internal: false,
      arguments: {},
    },
  });

  const onSubmit = (data: CreateExchangeFormValues) => {
    createMutation.mutate(
      {
        vhost,
        name: data.name,
        request: {
          type: data.type,
          auto_delete: data.auto_delete,
          durable: data.durable,
          internal: data.internal,
          arguments: data.arguments as Record<string, string | number | boolean>,
        },
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-6 sm:max-w-3xl">
        <DialogHeader className="space-y-2 pr-10">
          <DialogTitle className="text-2xl font-semibold tracking-tight">{t("exchanges.createTitle")}</DialogTitle>
          <DialogDescription className="text-base">
            {t("exchanges.createDescription", { vhost })}
          </DialogDescription>
        </DialogHeader>

        <MutationErrorAlert error={createMutation.error} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-background/30 px-4 py-1">
            <FormFieldRow
              htmlFor="name"
              label={t("vhosts.name")}
              error={errors.name?.message}
            >
              <Input
                id="name"
                {...register("name")}
                disabled={createMutation.isPending}
              />
            </FormFieldRow>

            <div className="grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-sm font-semibold text-muted-foreground">
                  {t("exchanges.type")}
                </Label>
                <Select
                  disabled={createMutation.isPending}
                  value={watch("type")}
                  onValueChange={(val) => setValue("type", val)}
                >
                  <SelectTrigger id="type" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">direct</SelectItem>
                    <SelectItem value="fanout">fanout</SelectItem>
                    <SelectItem value="topic">topic</SelectItem>
                    <SelectItem value="headers">headers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="durable" className="text-sm font-semibold text-muted-foreground">
                  {t("exchanges.durability")}
                </Label>
                <Select
                  disabled={createMutation.isPending}
                  value={watch("durable") ? "true" : "false"}
                  onValueChange={(val) => setValue("durable", val === "true")}
                >
                  <SelectTrigger id="durable" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t("exchanges.durable")}</SelectItem>
                    <SelectItem value="false">{t("exchanges.transient")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="auto_delete" className="text-sm font-semibold text-muted-foreground">
                  {t("exchanges.autoDelete")}
                </Label>
                <Select
                  disabled={createMutation.isPending}
                  value={watch("auto_delete") ? "true" : "false"}
                  onValueChange={(val) => setValue("auto_delete", val === "true")}
                >
                  <SelectTrigger id="auto_delete" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">{t("common.no")}</SelectItem>
                    <SelectItem value="true">{t("common.yes")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="internal" className="text-sm font-semibold text-muted-foreground">
                  {t("exchanges.internal")}
                </Label>
                <Select
                  disabled={createMutation.isPending}
                  value={watch("internal") ? "true" : "false"}
                  onValueChange={(val) => setValue("internal", val === "true")}
                >
                  <SelectTrigger id="internal" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">{t("common.no")}</SelectItem>
                    <SelectItem value="true">{t("common.yes")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold">{t("exchanges.arguments")}</h3>
            <ArgumentsEditor
              value={(watch("arguments") || {}) as Record<string, ArgumentValue>}
              onChange={(val) => setValue("arguments", val)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-border/60 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
              className="h-11 rounded-full px-6"
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="h-11 rounded-full px-7">
              {createMutation.isPending ? t("common.loading") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
