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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("queues.createQueue")}</DialogTitle>
          <DialogDescription>
            {t("queues.createQueue")} <strong>{vhost}</strong>
          </DialogDescription>
        </DialogHeader>

        <MutationErrorAlert error={createMutation.error} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t("queues.name")}</Label>
              <Input
                id="name"
                {...register("name")}
                disabled={createMutation.isPending}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="node">{t("queues.node")} ({t("common.optional")})</Label>
              <Input
                id="node"
                placeholder="e.g. rabbit@localhost"
                {...register("node")}
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="type">{t("queues.type")}</Label>
              <Select
                disabled={createMutation.isPending}
                value={watch("type")}
                onValueChange={(val) => setValue("type", val as "classic" | "quorum" | "stream")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">{t("vhosts.classic")}</SelectItem>
                  <SelectItem value="quorum">{t("vhosts.quorum")}</SelectItem>
                  <SelectItem value="stream">{t("vhosts.stream")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="durable">{t("queues.durability")}</Label>
              <Select
                disabled={createMutation.isPending}
                value={watch("durable") ? "true" : "false"}
                onValueChange={(val) => setValue("durable", val === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t("queues.durable")}</SelectItem>
                  <SelectItem value="false">{t("queues.transient")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto_delete">{t("queues.autoDelete")}</Label>
              <Select
                disabled={createMutation.isPending}
                value={watch("auto_delete") ? "true" : "false"}
                onValueChange={(val) => setValue("auto_delete", val === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">{t("common.no")}</SelectItem>
                  <SelectItem value="true">{t("common.yes")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("queues.arguments")}</Label>
            <ArgumentsEditor
              value={(watch("arguments") || {}) as Record<string, ArgumentValue>}
              onChange={(val) => setValue("arguments", val)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t("common.loading") : t("common.add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
