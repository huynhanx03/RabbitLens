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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { useGetMessagesMutation } from "@/domains/queues/queue-query";
import type { MessageResponse } from "@/domains/queues/queue-schema";
import { useRouteContext } from "@tanstack/react-router";
import { AmqpValue } from "@/components/shared/amqp-value";

const getMessagesSchema = z.object({
  count: z.number().min(1).max(100000),
  ackmode: z.enum([
    "ack_requeue_true",
    "ack_requeue_false",
    "reject_requeue_true",
    "reject_requeue_false",
  ]),
  encoding: z.enum(["auto", "base64"]),
});

type GetMessagesFormValues = z.infer<typeof getMessagesSchema>;

export interface GetMessagesDialogProps {
  vhost: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GetMessagesDialog({
  vhost,
  name,
  open,
  onOpenChange,
}: GetMessagesDialogProps) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const getMessagesMutation = useGetMessagesMutation(context.apiClient);
  const [messages, setMessages] = useState<MessageResponse[] | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<GetMessagesFormValues>({
    resolver: zodResolver(getMessagesSchema),
    defaultValues: {
      count: 1,
      ackmode: "ack_requeue_true",
      encoding: "auto",
    },
  });

  const onSubmit = (data: GetMessagesFormValues) => {
    setMessages(null);
    getMessagesMutation.mutate(
      {
        vhost,
        name,
        request: {
          count: data.count,
          ackmode: data.ackmode,
          encoding: data.encoding,
          truncate: 50000,
        },
      },
      {
        onSuccess: (response) => {
          setMessages(response);
        },
      }
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setMessages(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("queues.getMessages")}</DialogTitle>
          <DialogDescription>
            {t("queues.getMessages")} <strong>{name}</strong>
          </DialogDescription>
        </DialogHeader>

        <MutationErrorAlert error={getMessagesMutation.error} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ackmode">Ack Mode</Label>
              <Select
                disabled={getMessagesMutation.isPending}
                value={watch("ackmode")}
                onValueChange={(value) => {
                  const parsed = getMessagesSchema.shape.ackmode.safeParse(value);
                  if (parsed.success) setValue("ackmode", parsed.data);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ack_requeue_true">Ack message requeue true</SelectItem>
                  <SelectItem value="reject_requeue_true">Reject requeue true</SelectItem>
                  <SelectItem value="reject_requeue_false">Reject requeue false</SelectItem>
                  <SelectItem value="ack_requeue_false">Ack message requeue false</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="encoding">{t("queues.encoding")}</Label>
              <Select
                disabled={getMessagesMutation.isPending}
                value={watch("encoding")}
                onValueChange={(value) => {
                  const parsed = getMessagesSchema.shape.encoding.safeParse(value);
                  if (parsed.success) setValue("encoding", parsed.data);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">{t("queues.autoString")}</SelectItem>
                  <SelectItem value="base64">{t("queues.base64")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="count">{t("queues.count")}</Label>
              <Input
                id="count"
                type="number"
                {...register("count", { valueAsNumber: true })}
                disabled={getMessagesMutation.isPending}
              />
              {errors.count && (
                <p className="text-sm text-destructive">{errors.count.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={getMessagesMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={getMessagesMutation.isPending}>
              {getMessagesMutation.isPending ? t("common.loading") : t("queues.getMessage")}
            </Button>
          </div>
        </form>

        {messages && messages.length === 0 && (
          <div className="mt-4 p-4 text-center rounded border bg-muted">
            {t("queues.noMessages")}
          </div>
        )}

        {messages && messages.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold">{messages.length} {t("queues.messages").toLowerCase()}</h3>
            {messages.map((msg, idx) => (
              <div key={idx} className="rounded-md border bg-card text-card-foreground p-4 text-sm space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="font-medium text-muted-foreground mb-1">Exchange</div>
                    <div>{msg.exchange === "" ? "(AMQP default)" : msg.exchange}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground mb-1">Routing Key</div>
                    <div>{msg.routing_key || "-"}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground mb-1">Redelivered</div>
                    <div>{msg.redelivered ? t("common.yes") : t("common.no")}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground mb-1">{t("queues.properties")}</div>
                    <AmqpValue value={msg.properties} />
                  </div>
                </div>

                <div>
                  <div className="font-medium text-muted-foreground mb-2">
                    Payload ({msg.payload_bytes} {t("queues.bytes")}, {msg.payload_encoding} {t("queues.encoding").toLowerCase()})
                  </div>
                  <pre className="p-3 rounded-md bg-muted overflow-auto whitespace-pre-wrap font-mono text-xs max-h-[300px]">
                    {msg.payload}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
