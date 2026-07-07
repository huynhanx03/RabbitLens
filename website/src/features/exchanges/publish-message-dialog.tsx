import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { usePublishMessageMutation } from "@/domains/exchanges/exchange-query";
import { useRouteContext } from "@tanstack/react-router";

const publishMessageSchema = z.object({
  routing_key: z.string(),
  payload_encoding: z.enum(["string", "base64"]),
  payload: z.string(),
  properties: z.record(z.string(), z.unknown()),
});

type PublishMessageFormValues = z.infer<typeof publishMessageSchema>;

export interface PublishMessageDialogProps {
  vhost: string;
  name: string; // empty string for default exchange
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRoutingKey?: string;
  lockRoutingKey?: boolean;
}

export function PublishMessageDialog({
  vhost,
  name,
  open,
  onOpenChange,
  initialRoutingKey = "",
  lockRoutingKey = false,
}: PublishMessageDialogProps) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const publishMutation = usePublishMessageMutation(context.apiClient);
  const [publishResult, setPublishResult] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PublishMessageFormValues>({
    resolver: zodResolver(publishMessageSchema),
    defaultValues: {
      routing_key: initialRoutingKey,
      payload_encoding: "string",
      payload: "",
      properties: {},
    },
  });

  const onSubmit = (data: PublishMessageFormValues) => {
    setPublishResult(null);
    publishMutation.mutate(
      {
        vhost,
        name,
        request: {
          routing_key: data.routing_key,
          payload_encoding: data.payload_encoding,
          payload: data.payload,
          properties: data.properties as Record<string, string | number | boolean>,
        },
      },
      {
        onSuccess: (response) => {
          if (response.routed) {
            setPublishResult(t("exchanges.publishSuccess"));
          } else {
            setPublishResult(t("exchanges.publishError") + " (no matching queues)");
          }
          // Intentionally not closing dialog or resetting to allow quick re-publishing
        },
      }
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setPublishResult(null);
    }
    onOpenChange(newOpen);
  };

  const displayName = name === "" ? "(AMQP default)" : name;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-6 sm:max-w-3xl">
        <DialogHeader className="space-y-2 pr-10">
          <DialogTitle className="text-2xl font-semibold tracking-tight">{t("exchanges.publishMessage")}</DialogTitle>
          <DialogDescription className="text-base">
            {t("exchanges.publishMessage")} <strong>{displayName}</strong>
          </DialogDescription>
        </DialogHeader>

        <MutationErrorAlert error={publishMutation.error} />
        {publishResult && (
          <div className="rounded border bg-muted p-3 text-sm">
            {publishResult}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-background/30 px-4 py-1">
            <FormFieldRow
              htmlFor="routing_key"
              label={t("exchanges.routingKey")}
              error={errors.routing_key?.message}
            >
              <Input
                id="routing_key"
                {...register("routing_key")}
                disabled={publishMutation.isPending || lockRoutingKey}
              />
            </FormFieldRow>

            <FormFieldRow htmlFor="payload_encoding" label={t("exchanges.payloadEncoding")}>
              <Select
                disabled={publishMutation.isPending}
                value={watch("payload_encoding")}
                onValueChange={(val) => setValue("payload_encoding", val as "string" | "base64")}
              >
                <SelectTrigger id="payload_encoding" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">{t("common.type")} String</SelectItem>
                  <SelectItem value="base64">Base64</SelectItem>
                </SelectContent>
              </Select>
            </FormFieldRow>

            <div className="space-y-2 py-4">
              <Label htmlFor="payload" className="text-sm font-semibold text-muted-foreground">
                {t("exchanges.payload")}
              </Label>
              <Textarea
                id="payload"
                rows={5}
                {...register("payload")}
                disabled={publishMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold">{t("exchanges.headers")} & {t("exchanges.properties")}</h3>
            <ArgumentsEditor
              value={(watch("properties") || {}) as Record<string, ArgumentValue>}
              onChange={(val) => setValue("properties", val)}
              disabled={publishMutation.isPending}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-border/60 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={publishMutation.isPending}
              className="h-11 rounded-full px-6"
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={publishMutation.isPending} className="h-11 rounded-full px-7">
              {publishMutation.isPending ? t("common.loading") : t("exchanges.publish")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
