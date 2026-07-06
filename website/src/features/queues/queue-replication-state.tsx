import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/components/shared/status-badge";

type QueueReplicationStateProps = {
  leader?: string | null;
  members: string[];
  online: string[];
};

export function QueueReplicationState({ leader, members, online }: QueueReplicationStateProps) {
  const { t } = useTranslation();
  const onlineSet = new Set(online);
  const majority = online.length >= Math.floor(members.length / 2) + 1;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t("queues.leader")}</span>
        <span className="font-mono font-medium">{leader ?? "—"}</span>
        <StatusBadge variant={majority ? "success" : "error"}>
          {majority ? t("queues.majorityAvailable") : t("queues.majorityUnavailable")}
        </StatusBadge>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => {
          const isOnline = onlineSet.has(member);
          return (
            <li key={member} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
              <span className="truncate font-mono">{member}</span>
              <StatusBadge variant={isOnline ? "success" : "error"}>
                {isOnline ? t("queues.online") : t("queues.offline")}
              </StatusBadge>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
