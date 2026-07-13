import { useTranslation } from "react-i18next";

import { AmqpValue } from "@/components/shared/amqp-value";
import { DetailGrid } from "@/components/shared/detail-grid";
import { SectionCard } from "@/components/shared/section-card";
import type { Queue } from "@/domains/queues/queue-schema";

function formatBoolean(
  value: boolean | undefined,
  yes: string,
  no: string,
) {
  if (value === undefined) return undefined;
  return value ? yes : no;
}

export function QueueConfigurationSection({ queue }: { queue: Queue }) {
  const { t } = useTranslation();
  const argumentsValue = queue.arguments ?? {};
  const renderedArguments =
    Object.keys(argumentsValue).length === 0 ? (
      <span className="font-mono">{"{}"}</span>
    ) : (
      <AmqpValue value={argumentsValue} />
    );

  return (
    <SectionCard
      title={t("queues.configuration")}
      description={t("queues.actualBrokerConfiguration")}
    >
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">
          {t("queues.queueDeclaration")}
        </h3>
        <DetailGrid
          unavailableLabel={t("common.unavailable")}
          items={[
            { label: t("queues.name"), value: queue.name, monospace: true },
            { label: t("queues.vhost"), value: queue.vhost, monospace: true },
            { label: t("queues.type"), value: queue.type },
            {
              label: t("queues.durable"),
              value: formatBoolean(
                queue.durable,
                t("common.yes"),
                t("common.no"),
              ),
            },
            {
              label: t("queues.autoDelete"),
              value: formatBoolean(
                queue.auto_delete,
                t("common.yes"),
                t("common.no"),
              ),
            },
            {
              label: t("consumerDetails.exclusive"),
              value: formatBoolean(
                queue.exclusive,
                t("common.yes"),
                t("common.no"),
              ),
            },
            { label: t("queues.arguments"), value: renderedArguments },
            { label: t("queues.node"), value: queue.node, monospace: true },
          ]}
        />
      </div>
    </SectionCard>
  );
}
