import { useTranslation } from "react-i18next";
import { DefinitionList } from "@/components/shared/definition-list";
import { SectionCard } from "@/components/shared/section-card";
import type { NodeResponse } from "@/api/nodes-schema";

type MetricItem = { label: string; value: number | undefined };

function MetricSection({ title, items }: { title: string; items: MetricItem[] }) {
  const available = items.filter((item) => item.value !== undefined);
  if (available.length === 0) return null;
  return <SectionCard title={title}><DefinitionList items={available} unavailableLabel="—" /></SectionCard>;
}

export function NodeOperationalDiagnostics({ node }: { node: NodeResponse }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <MetricSection title={t("nodes.persistence")} items={[
        { label: t("nodes.schemaRamTransactions"), value: node.mnesia_ram_tx_count },
        { label: t("nodes.schemaDiskTransactions"), value: node.mnesia_disk_tx_count },
        { label: t("nodes.queueIndexJournalWrites"), value: node.queue_index_journal_write_count },
        { label: t("nodes.queueIndexReads"), value: node.queue_index_read_count },
        { label: t("nodes.queueIndexWrites"), value: node.queue_index_write_count },
        { label: t("nodes.messageStoreReads"), value: node.msg_store_read_count },
        { label: t("nodes.messageStoreWrites"), value: node.msg_store_write_count },
      ]} />
      <MetricSection title={t("nodes.io")} items={[
        { label: t("nodes.ioReads"), value: node.io_read_count },
        { label: t("nodes.ioWrites"), value: node.io_write_count },
        { label: t("nodes.ioSeeks"), value: node.io_seek_count },
        { label: t("nodes.ioSyncs"), value: node.io_sync_count },
        { label: t("nodes.ioReadLatency"), value: node.io_read_avg_time },
        { label: t("nodes.ioWriteLatency"), value: node.io_write_avg_time },
      ]} />
      <MetricSection title={t("nodes.churn")} items={[
        { label: t("nodes.connectionsCreated"), value: node.connection_created },
        { label: t("nodes.connectionsClosed"), value: node.connection_closed },
        { label: t("nodes.channelsCreated"), value: node.channel_created },
        { label: t("nodes.channelsClosed"), value: node.channel_closed },
        { label: t("nodes.queuesDeclared"), value: node.queue_declared },
        { label: t("nodes.queuesCreated"), value: node.queue_created },
        { label: t("nodes.queuesDeleted"), value: node.queue_deleted },
      ]} />
    </div>
  );
}
