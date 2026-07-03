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
import { useCreateBindingMutation } from "@/domains/bindings/binding-query";
import { useRouteContext } from "@tanstack/react-router";

const createBindingSchema = z.object({
  source: z.string().optional(),
  destinationType: z.enum(["queue", "exchange"]).optional(),
  destination: z.string().optional(),
  routing_key: z.string(),
  arguments: z.record(z.string(), z.unknown()),
});

type CreateBindingFormValues = z.infer<typeof createBindingSchema>;

export type BindingMode = "to-queue" | "to-exchange" | "from-exchange";

export interface CreateBindingDialogProps {
  vhost: string;
  resourceName: string;
  mode: BindingMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBindingDialog({
  vhost,
  resourceName,
  mode,
  open,
  onOpenChange,
}: CreateBindingDialogProps) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const createMutation = useCreateBindingMutation(context.apiClient);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
  } = useForm<CreateBindingFormValues>({
    resolver: zodResolver(createBindingSchema),
    defaultValues: {
      source: "",
      destinationType: "queue",
      destination: "",
      routing_key: "",
      arguments: {},
    },
  });

  const onSubmit = (data: CreateBindingFormValues) => {
    let sourceEx = "";
    let destType: "q" | "e" = "q";
    let destName = "";

    if (mode === "to-queue") {
      sourceEx = data.source || "";
      destType = "q";
      destName = resourceName;
    } else if (mode === "to-exchange") {
      sourceEx = data.source || "";
      destType = "e";
      destName = resourceName;
    } else if (mode === "from-exchange") {
      sourceEx = resourceName;
      destType = data.destinationType === "queue" ? "q" : "e";
      destName = data.destination || "";
    }

    createMutation.mutate(
      {
        vhost,
        exchange: sourceEx,
        destinationType: destType,
        destination: destName,
        request: {
          routing_key: data.routing_key,
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

  const isDestMode = mode === "from-exchange";
  const title = isDestMode ? t("bindings.bindTo") : t("bindings.bindFrom");
  const targetLabel = isDestMode ? t("bindings.destination") : t("bindings.source");
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t("bindings.addBinding")} <strong>{vhost}</strong>
          </DialogDescription>
        </DialogHeader>

        <MutationErrorAlert error={createMutation.error} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {!isDestMode && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="source">{targetLabel}</Label>
                <Input
                  id="source"
                  {...register("source")}
                  disabled={createMutation.isPending}
                />
              </div>
            )}

            {isDestMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="destinationType">{t("bindings.destinationType")}</Label>
                  <Select
                    disabled={createMutation.isPending}
                    value={watch("destinationType")}
                    onValueChange={(val) => setValue("destinationType", val as "queue" | "exchange")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="queue">Queue</SelectItem>
                      <SelectItem value="exchange">Exchange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">{t("bindings.destination")}</Label>
                  <Input
                    id="destination"
                    {...register("destination")}
                    disabled={createMutation.isPending}
                  />
                </div>
              </>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="routing_key">{t("bindings.routingKey")}</Label>
              <Input
                id="routing_key"
                {...register("routing_key")}
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("bindings.arguments")}</Label>
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
              {createMutation.isPending ? t("common.loading") : t("bindings.bind")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
