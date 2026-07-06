import { useTranslation } from "react-i18next";
import type { StreamPublisher } from "@/domains/extensions/streams/stream-api";

export function StreamPublisherTable({ publishers }: { publishers: StreamPublisher[] }) {
  const { t } = useTranslation();
  if (publishers.length === 0) return <p className="text-sm text-muted-foreground">{t("streams.noPublishers")}</p>;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-3xl text-left text-sm">
        <thead className="bg-muted/60 text-muted-foreground"><tr><th className="px-3 py-2">{t("streams.connection")}</th><th className="px-3 py-2">ID</th><th className="px-3 py-2">{t("streams.reference")}</th><th className="px-3 py-2">{t("streams.messagesPublished")}</th><th className="px-3 py-2">{t("streams.confirmed")}</th><th className="px-3 py-2">{t("streams.errored")}</th></tr></thead>
        <tbody>{publishers.map((publisher, index) => <tr key={`${String(publisher.publisher_id)}-${index}`} className="border-t"><td className="px-3 py-2 font-mono">{publisher.connection_details?.name ?? "—"}</td><td className="px-3 py-2">{publisher.publisher_id ?? "—"}</td><td className="px-3 py-2">{publisher.reference ?? "—"}</td><td className="px-3 py-2 tabular-nums">{publisher.published ?? "—"}</td><td className="px-3 py-2 tabular-nums">{publisher.confirmed ?? "—"}</td><td className="px-3 py-2 tabular-nums">{publisher.errored ?? "—"}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
