import { useTranslation } from "react-i18next";
import { AmqpValue } from "@/components/shared/amqp-value";
import { SectionCard } from "@/components/shared/section-card";
import type { ConnectionSession, IncomingLink, OutgoingLink } from "@/domains/connections/session-schema";

function Value({ value }: { value: unknown }) {
  return value === null || value === undefined ? <span aria-label="Unavailable">—</span> : <AmqpValue value={value} />;
}

function LinkRows({ links, direction }: { links: Array<IncomingLink | OutgoingLink>; direction: "incoming" | "outgoing" }) {
  const { t } = useTranslation();
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-3xl text-left text-sm">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th className="px-3 py-2">{t("connections.linkName")}</th>
            <th className="px-3 py-2">{t("connections.address")}</th>
            <th className="px-3 py-2">{t("connections.deliveryCount")}</th>
            <th className="px-3 py-2">{t("connections.linkCredit")}</th>
            <th className="px-3 py-2">{t("connections.settlement")}</th>
          </tr>
        </thead>
        <tbody>
          {links.map((link, index) => {
            const incoming = direction === "incoming" ? link as IncomingLink : null;
            const outgoing = direction === "outgoing" ? link as OutgoingLink : null;
            return (
              <tr key={`${String(link.link_name)}-${index}`} className="border-t">
                <td className="px-3 py-2 font-medium"><Value value={link.link_name} /></td>
                <td className="px-3 py-2"><Value value={incoming?.target_address ?? outgoing?.source_address} /></td>
                <td className="px-3 py-2"><Value value={link.delivery_count} /></td>
                <td className="px-3 py-2"><Value value={link.credit} /></td>
                <td className="px-3 py-2"><Value value={incoming?.snd_settle_mode ?? outgoing?.send_settled} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AmqpSessionList({ sessions }: { sessions: ConnectionSession[] }) {
  const { t } = useTranslation();
  return (
    <SectionCard title={t("connections.sessionsTitle")}>
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("connections.noSessions")}</p>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <section key={String(session.channel_number)} className="space-y-3 rounded-xl border p-4">
              <h3 className="font-semibold">{t("connections.sessionChannel", { channel: session.channel_number })}</h3>
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><span className="text-muted-foreground">{t("connections.incomingWindow")}: </span><Value value={session.incoming_window} /></div>
                <div><span className="text-muted-foreground">{t("connections.remoteIncomingWindow")}: </span><Value value={session.remote_incoming_window} /></div>
                <div><span className="text-muted-foreground">{t("connections.remoteOutgoingWindow")}: </span><Value value={session.remote_outgoing_window} /></div>
                <div><span className="text-muted-foreground">{t("connections.unsettledDeliveries")}: </span><Value value={session.outgoing_unsettled_deliveries} /></div>
              </div>
              {session.incoming_links.length > 0 ? <div className="space-y-2"><h4 className="text-sm font-medium">{t("connections.incomingLinks")}</h4><LinkRows links={session.incoming_links} direction="incoming" /></div> : null}
              {session.outgoing_links.length > 0 ? <div className="space-y-2"><h4 className="text-sm font-medium">{t("connections.outgoingLinks")}</h4><LinkRows links={session.outgoing_links} direction="outgoing" /></div> : null}
            </section>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
