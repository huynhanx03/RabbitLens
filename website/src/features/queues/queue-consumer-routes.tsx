import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Trash2 } from "lucide-react";

import { AmqpValue } from "@/components/shared/amqp-value";
import { AsyncState } from "@/components/shared/async-state";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Binding } from "@/domains/bindings/binding-schema";
import { destructiveIconButtonClassName } from "@/lib/utils";
import type {
  QueueTopologyConfig,
  QueueTopologyRoute,
} from "./queue-topology-view-model";

type QueueConsumerRoutesProps = {
  topology: QueueTopologyConfig;
  isPending?: boolean;
  isError?: boolean;
  hasData?: boolean;
  error?: unknown;
  onAddBinding: () => void;
  onRemoveBinding: (binding: Binding) => void;
  onRetryBindings: () => void;
  onRetryExchange: (exchangeName: string) => void;
};

function ArgumentsValue({ value }: { value: Record<string, unknown> }) {
  return Object.keys(value).length === 0 ? (
    <span className="font-mono text-xs">{"{}"}</span>
  ) : (
    <AmqpValue value={value} />
  );
}

export function QueueConsumerRoutes({
  topology,
  isPending = false,
  isError = false,
  hasData = false,
  error,
  onAddBinding,
  onRemoveBinding,
  onRetryBindings,
  onRetryExchange,
}: QueueConsumerRoutesProps) {
  const { t } = useTranslation();
  const [systemOpen, setSystemOpen] = useState(false);

  return (
    <SectionCard
      title={t("queues.consumerRoutes")}
      description={t("queues.consumerRoutesDescription", {
        count: topology.explicitRoutes.length,
      })}
      action={
        <Button type="button" size="sm" onClick={onAddBinding}>
          {t("bindings.addBinding")}
        </Button>
      }
    >
      <AsyncState
        isPending={isPending}
        isError={isError}
        hasData={hasData}
        error={error}
        onRetry={onRetryBindings}
        isEmpty={!isPending && topology.explicitRoutes.length === 0}
        emptyTitle={t("queues.noExplicitBindings")}
        emptyDescription={t("queues.noExplicitBindingsDescription")}
      >
        <div className="space-y-3">
          {topology.explicitRoutes.map((route) => (
            <ExplicitRoute
              key={`${route.binding.source}-${route.binding.properties_key}`}
              route={route}
              queueName={topology.queue.name}
              onRemove={() => onRemoveBinding(route.binding)}
              onRetryExchange={onRetryExchange}
            />
          ))}
        </div>
      </AsyncState>

      {topology.systemRoutes.length > 0 ? (
        <details
          className="group mt-4 rounded-xl border border-border/60 bg-muted/20 p-3"
          onToggle={(event) => setSystemOpen(event.currentTarget.open)}
        >
          <summary
            role="button"
            className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium"
          >
            <ChevronRight
              aria-hidden="true"
              className="size-4 transition-transform group-open:rotate-90"
            />
            {t("queues.systemBindings", {
              count: topology.systemRoutes.length,
            })}
          </summary>
          {systemOpen ? (
            <div className="mt-3 space-y-2">
              {topology.systemRoutes.map((route) => (
                <div
                  key={route.binding.properties_key}
                  className="rounded-lg border bg-background/50 p-3 text-sm"
                >
                  <span className="font-medium">
                    {t("queues.defaultExchange")}
                  </span>
                  <span className="mx-2 text-muted-foreground" aria-hidden="true">
                    →
                  </span>
                  <span className="font-mono">
                    {route.binding.routing_key}
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("queues.systemBindingDescription")}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </details>
      ) : null}
    </SectionCard>
  );
}

function ExplicitRoute({
  route,
  queueName,
  onRemove,
  onRetryExchange,
}: {
  route: QueueTopologyRoute;
  queueName: string;
  onRemove: () => void;
  onRetryExchange: (exchangeName: string) => void;
}) {
  const { t } = useTranslation();
  const exchange = route.exchange;
  const routingKey =
    route.binding.routing_key === "" ? '""' : route.binding.routing_key;
  const bindingArguments = JSON.stringify(route.binding.arguments);
  const routeLabel = t("queues.consumerRouteAccessible", {
    exchange: route.binding.source,
    queue: queueName,
    routingKey,
  });

  return (
    <article
      aria-label={routeLabel}
      className="grid gap-3 rounded-xl border border-border/60 bg-background/30 p-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] lg:items-center"
    >
      <div className="min-w-0 rounded-lg border bg-muted/20 p-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {t("queues.exchange")}
        </span>
        <Link
          to="/exchanges/$vhost/$name"
          params={{
            vhost: route.binding.vhost,
            name: route.binding.source,
          }}
          className="mt-1 block truncate font-mono font-medium text-primary hover:underline"
        >
          {route.binding.source}
        </Link>

        {route.exchangeStatus === "available" && exchange ? (
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {exchange.type ?? t("common.unavailable")}
              </Badge>
              <Badge variant="outline">
                {exchange.durable === undefined
                  ? t("common.unavailable")
                  : exchange.durable
                    ? t("queues.durable")
                    : t("queues.transient")}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="mr-2 font-medium">
                {t("bindings.arguments")}:
              </span>
              <ArgumentsValue value={exchange.arguments ?? {}} />
            </div>
          </div>
        ) : route.exchangeStatus === "loading" ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("common.loading")}
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-destructive">
              {t("queues.exchangeConfigurationUnavailable")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRetryExchange(route.binding.source)}
            >
              {t("common.retry")}
            </Button>
          </div>
        )}
      </div>

      <div className="text-center text-sm text-primary">
        <span aria-hidden="true">→</span>
        <span className="block font-mono text-xs">{routingKey}</span>
        <div className="mt-1 text-left text-xs text-muted-foreground">
          <span className="mr-2 font-medium">{t("bindings.arguments")}:</span>
          <ArgumentsValue value={route.binding.arguments} />
        </div>
      </div>

      <div className="min-w-0 rounded-lg border bg-muted/20 p-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {t("queues.name")}
        </span>
        <span className="mt-1 block truncate font-mono font-medium">
          {queueName}
        </span>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={destructiveIconButtonClassName}
        onClick={onRemove}
        aria-label={t("queues.removeBindingFrom", {
          exchange: route.binding.source,
          routingKey,
          arguments: bindingArguments,
        })}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </article>
  );
}
