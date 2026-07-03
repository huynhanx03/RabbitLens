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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("exchanges.createTitle")}</DialogTitle>
          <DialogDescription>
            Add a new exchange to virtual host <strong>{vhost}</strong>
          </DialogDescription>
        </DialogHeader>

        <MutationErrorAlert error={createMutation.error} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t("vhosts.name")}</Label>
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
              <Label htmlFor="type">{t("exchanges.type")}</Label>
              <Select
                disabled={createMutation.isPending}
                value={watch("type")}
                onValueChange={(val) => setValue("type", val)}
              >
                <SelectTrigger>
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
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="durable">{t("exchanges.durability")}</Label>
              <Select
                disabled={createMutation.isPending}
                value={watch("durable") ? "true" : "false"}
                onValueChange={(val) => setValue("durable", val === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Durable</SelectItem>
                  <SelectItem value="false">Transient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto_delete">{t("exchanges.autoDelete")}</Label>
              <Select
                disabled={createMutation.isPending}
                value={watch("auto_delete") ? "true" : "false"}
                onValueChange={(val) => setValue("auto_delete", val === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="internal">{t("exchanges.internal")}</Label>
              <Select
                disabled={createMutation.isPending}
                value={watch("internal") ? "true" : "false"}
                onValueChange={(val) => setValue("internal", val === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Arguments</Label>
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
              {createMutation.isPending ? t("common.loading") : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
