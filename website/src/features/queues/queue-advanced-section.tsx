import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";

import { AmqpValue } from "@/components/shared/amqp-value";
import { DetailGrid } from "@/components/shared/detail-grid";
import type { Queue } from "@/domains/queues/queue-schema";
import { MessageInspector } from "./message-inspector";
import { QueueReplicationState } from "./queue-replication-state";

type QueueAdvancedSectionProps = {
  queue: Queue;
  vhost: string;
  name: string;
  tracingAvailable: boolean;
  onOpenTracing: () => void;
};

function LazyDisclosure({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <details
      className="group rounded-xl border border-border/60 bg-background/30 p-3"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        role="button"
        className="flex cursor-pointer list-none items-center gap-2 font-medium"
      >
        <ChevronRight
          aria-hidden="true"
          className="size-4 transition-transform group-open:rotate-90"
        />
        {title}
      </summary>
      {open ? <div className="mt-4">{children}</div> : null}
    </details>
  );
}

export function QueueAdvancedSection({
  queue,
  vhost,
  name,
  tracingAvailable,
  onOpenTracing,
}: QueueAdvancedSectionProps) {
  const { t } = useTranslation();
  const effectivePolicy = queue.effective_policy_definition ?? {};

  return (
    <section className="space-y-3" aria-labelledby="queue-advanced">
      <div>
        <h2 id="queue-advanced" className="text-base font-semibold">
          {t("queues.advanced")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("queues.advancedDescription")}
        </p>
      </div>

      <div className="grid gap-3">
        <LazyDisclosure title={t("queues.messageDiagnostics")}>
          <MessageInspector
            vhost={vhost}
            name={name}
            tracingAvailable={tracingAvailable}
            onOpenTracing={onOpenTracing}
          />
        </LazyDisclosure>

        <LazyDisclosure title={t("queues.policiesAndReplication")}>
          <div className="space-y-5">
            <DetailGrid
              unavailableLabel={t("common.unavailable")}
              items={[
                { label: t("policies.title"), value: queue.policy },
                {
                  label: t("queues.operatorPolicy"),
                  value: queue.operator_policy,
                },
                {
                  label: t("queues.effectivePolicy"),
                  value:
                    Object.keys(effectivePolicy).length === 0 ? (
                      <span className="font-mono">{"{}"}</span>
                    ) : (
                      <AmqpValue value={effectivePolicy} />
                    ),
                },
              ]}
            />

            {queue.members?.length ? (
              <QueueReplicationState
                leader={queue.leader}
                members={queue.members}
                online={queue.online ?? []}
              />
            ) : null}
          </div>
        </LazyDisclosure>
      </div>
    </section>
  );
}
