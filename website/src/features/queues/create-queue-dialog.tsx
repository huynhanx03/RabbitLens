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
import { useCreateQueueMutation } from "@/domains/queues/queue-query";
import { useRouteContext } from "@tanstack/react-router";

const createQueueSchema = z.object({
  name: z.string().min(1, "Name is required"),
  node: z.string().optional(),
  type: z.enum(["classic", "quorum", "stream"]),
  durable: z.boolean(),
  auto_delete: z.boolean(),
  arguments: z.record(z.string(), z.unknown()),
});

type CreateQueueFormValues = z.infer<typeof createQueueSchema>;

export interface CreateQueueDialogProps {
  vhost: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateQueueDialog({
  vhost,
  open,
  onOpenChange,
}: CreateQueueDialogProps) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const createMutation = useCreateQueueMutation(context.apiClient);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateQueueFormValues>({
    resolver: zodResolver(createQueueSchema),
    defaultValues: {
      name: "",
      node: "",
      type: "classic",
      durable: true,
      auto_delete: false,
      arguments: {},
    },
  });

  const onSubmit = (data: CreateQueueFormValues) => {
    // Merge x-queue-type into arguments if it is not classic
    const args = { ...data.arguments };
    if (data.type !== "classic") {
      args["x-queue-type"] = data.type;
    }

    createMutation.mutate(
      {
        vhost,
        name: data.name,
        request: {
          node: data.node || undefined,
          auto_delete: data.auto_delete,
          durable: data.durable,
          arguments: args as Record<string, string | number | boolean>,
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
          <DialogTitle className="text-2xl font-semibold tracking-tight">{t("queues.createQueue")}</DialogTitle>
          <DialogDescription className="text-base">
            {t("queues.createQueueDescription", { vhost })}
          </DialogDescription>
        </DialogHeader>

        <MutationErrorAlert error={createMutation.error} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-background/30 px-4 py-1">
            <FormFieldRow
              htmlFor="name"
              label={t("queues.name")}
              error={errors.name?.message}
            >
              <Input
                id="name"
                {...register("name")}
                disabled={createMutation.isPending}
              />
            </FormFieldRow>

            <FormFieldRow
              htmlFor="node"
              label={`${t("queues.node")} (${t("common.optional")})`}
            >
              <Input
                id="node"
                placeholder="e.g. rabbit@localhost"
                {...register("node")}
                disabled={createMutation.isPending}
              />
            </FormFieldRow>

            <div className="grid gap-4 py-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-sm font-semibold text-muted-foreground">
                  {t("queues.type")}
                </Label>
                <Select
                  disabled={createMutation.isPending}
                  value={watch("type")}
                  onValueChange={(val) => setValue("type", val as "classic" | "quorum" | "stream")}
                >
                  <SelectTrigger id="type" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">{t("vhosts.classic")}</SelectItem>
                    <SelectItem value="quorum">{t("vhosts.quorum")}</SelectItem>
                    <SelectItem value="stream">{t("vhosts.stream")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="durable" className="text-sm font-semibold text-muted-foreground">
                  {t("queues.durability")}
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
                    <SelectItem value="true">{t("queues.durable")}</SelectItem>
                    <SelectItem value="false">{t("queues.transient")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="auto_delete" className="text-sm font-semibold text-muted-foreground">
                  {t("queues.autoDelete")}
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
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold">{t("queues.arguments")}</h3>
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
              {createMutation.isPending ? t("common.loading") : t("common.add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
