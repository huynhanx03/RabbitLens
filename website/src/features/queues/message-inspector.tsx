import { useState } from "react";
import { useRouteContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Eye, Info, Radio, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";

import { AmqpValue } from "@/components/shared/amqp-value";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useGetMessagesMutation } from "@/domains/queues/queue-query";
import type { MessageResponse } from "@/domains/queues/queue-schema";
import { formatBytes } from "@/lib/utils";

const DEFAULT_SNAPSHOT_COUNT = 5;
const MAX_SNAPSHOT_COUNT = 20;
const SNAPSHOT_TRUNCATE_BYTES = 50_000;

type MessageInspectorProps = {
  vhost: string;
  name: string;
  tracingAvailable?: boolean;
  onOpenTracing?: () => void;
};

export function MessageInspector({
  vhost,
  name,
  tracingAvailable = false,
  onOpenTracing,
}: MessageInspectorProps) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const getMessages = useGetMessagesMutation(context.apiClient);
  const [count, setCount] = useState(DEFAULT_SNAPSHOT_COUNT);
  const [messages, setMessages] = useState<MessageResponse[] | null>(null);

  const safeCount = Math.min(Math.max(count || 1, 1), MAX_SNAPSHOT_COUNT);

  const loadSnapshot = () => {
    setMessages(null);
    getMessages.mutate(
      {
        vhost,
        name,
        request: {
          count: safeCount,
          ackmode: "ack_requeue_true",
          encoding: "auto",
          truncate: SNAPSHOT_TRUNCATE_BYTES,
        },
      },
      {
        onSuccess: setMessages,
      },
    );
  };

  return (
    <section
      aria-labelledby="message-inspector-title"
      className="space-y-4"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-primary/20 bg-primary/10 p-2 text-primary">
              <Eye className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 id="message-inspector-title" className="text-base font-semibold tracking-tight">
              {t("queues.messageInspector")}
            </h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("queues.messageInspectorDescription")}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="message-inspector-count" className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("queues.snapshotCount")}
            </Label>
            <Input
              id="message-inspector-count"
              type="number"
              min={1}
              max={MAX_SNAPSHOT_COUNT}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              onBlur={() => setCount(safeCount)}
              className="h-11 w-28 text-center tabular-nums"
              disabled={getMessages.isPending}
            />
          </div>
          <Button
            type="button"
            onClick={loadSnapshot}
            disabled={getMessages.isPending}
            className="h-11"
          >
            <RotateCcw aria-hidden="true" />
            {getMessages.isPending ? t("common.loading") : t("queues.loadSnapshot")}
          </Button>
          {messages ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setMessages(null)}
              className="h-11"
            >
              <Trash2 aria-hidden="true" />
              {t("queues.clearSnapshot")}
            </Button>
          ) : null}
          {tracingAvailable && onOpenTracing ? (
            <Button
              type="button"
              variant="outline"
              onClick={onOpenTracing}
              className="h-11"
            >
              <Radio aria-hidden="true" />
              {t("queues.openLiveTracing")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-status-warning/25 bg-status-warning/10 p-4 text-sm text-status-warning">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{t("queues.snapshotWarning")}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/50 p-4 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              {tracingAvailable
                ? t("queues.liveTracingAvailable")
                : t("queues.liveTracingUnavailable")}
            </p>
          </div>
        </div>
      </div>

      <MutationErrorAlert error={getMessages.error} />

      {messages?.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-8 text-center text-sm text-muted-foreground">
          {t("queues.noMessages")}
        </div>
      ) : null}

      {messages?.length ? (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {t("queues.snapshotLoaded", { count: messages.length })}
          </div>
          {messages.map((message, index) => (
            <MessageSnapshotCard
              key={`${message.exchange}-${message.routing_key}-${index}`}
              message={message}
              index={index}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function MessageSnapshotCard({
  message,
  index,
}: {
  message: MessageResponse;
  index: number;
}) {
  const { t } = useTranslation();
  const exchange = message.exchange === "" ? t("queues.defaultExchange") : message.exchange;

  return (
    <article className="overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="secondary" className="h-7 rounded-full px-3">
            #{index + 1}
          </Badge>
          <Badge variant="outline" className="h-7 rounded-full px-3 font-mono">
            {message.payload_encoding}
          </Badge>
          {message.redelivered ? (
            <Badge className="h-7 rounded-full border-status-warning/25 bg-status-warning/10 px-3 text-status-warning">
              {t("queues.redelivered")}
            </Badge>
          ) : null}
        </div>
        <div className="text-sm text-muted-foreground">
          {formatBytes(message.payload_bytes)} · {t("queues.remainingAfterSnapshot", { count: message.message_count })}
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <dl className="grid content-start gap-4 sm:grid-cols-2">
          <Field label={t("queues.exchange")} value={exchange} />
          <Field label={t("bindings.routingKey")} value={message.routing_key || "—"} />
          <div className="sm:col-span-2">
            <dt className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("queues.properties")}
            </dt>
            <dd className="rounded-2xl bg-background/50 p-3 text-sm">
              <AmqpValue value={message.properties} />
            </dd>
          </div>
        </dl>

        <div className="min-w-0 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("queues.payload")}
          </div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-background/70 p-4 font-mono text-sm leading-6">
            {message.payload}
          </pre>
        </div>
      </div>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words font-mono text-sm text-foreground">{value}</dd>
    </div>
  );
}
