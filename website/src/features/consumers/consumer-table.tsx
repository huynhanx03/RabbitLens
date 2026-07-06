import { useTranslation } from "react-i18next";
import { AmqpValue } from "@/components/shared/amqp-value";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Consumer } from "@/domains/consumers/consumer-schema";

export function ConsumerTable({ consumers }: { consumers: Consumer[] }) {
  const { t } = useTranslation();

  if (consumers.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("consumerDetails.empty")}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-5xl text-left text-sm">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th className="px-3 py-2">{t("consumerDetails.tag")}</th>
            <th className="px-3 py-2">{t("consumerDetails.owner")}</th>
            <th className="px-3 py-2">{t("consumerDetails.queue")}</th>
            <th className="px-3 py-2">{t("consumerDetails.ack")}</th>
            <th className="px-3 py-2">{t("consumerDetails.exclusive")}</th>
            <th className="px-3 py-2">{t("consumerDetails.prefetch")}</th>
            <th className="px-3 py-2">{t("consumerDetails.status")}</th>
            <th className="px-3 py-2">{t("consumerDetails.timeout")}</th>
            <th className="px-3 py-2">{t("consumerDetails.arguments")}</th>
          </tr>
        </thead>
        <tbody>
          {consumers.map((consumer) => {
            const owner = consumer.channel_details?.name ?? consumer.channel_details?.connection_name;
            return (
              <tr key={`${consumer.queue.vhost}-${consumer.queue.name}-${consumer.consumer_tag}`} className="border-t align-top">
                <td className="px-3 py-2 font-medium">{consumer.consumer_tag}</td>
                <td className="px-3 py-2">{owner ? <a className="text-primary hover:underline" href={`/channels/${encodeURIComponent(owner)}`}>{owner}</a> : "—"}</td>
                <td className="px-3 py-2"><a className="text-primary hover:underline" href={`/queues/${encodeURIComponent(consumer.queue.vhost)}/${encodeURIComponent(consumer.queue.name)}`}>{consumer.queue.name}</a></td>
                <td className="px-3 py-2">{consumer.ack_required == null ? "—" : consumer.ack_required ? t("common.yes") : t("common.no")}</td>
                <td className="px-3 py-2">{consumer.exclusive == null ? "—" : consumer.exclusive ? t("common.yes") : t("common.no")}</td>
                <td className="px-3 py-2 tabular-nums">{consumer.prefetch_count ?? "—"}</td>
                <td className="px-3 py-2"><StatusBadge variant={consumer.active === false ? "warning" : "success"}>{consumer.active === false ? t("consumerDetails.inactive") : t("consumerDetails.active")}</StatusBadge></td>
                <td className="px-3 py-2 tabular-nums">{consumer.consumer_timeout ?? "—"}</td>
                <td className="px-3 py-2"><AmqpValue value={consumer.arguments ?? {}} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
