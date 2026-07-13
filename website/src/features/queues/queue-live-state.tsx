import { useTranslation } from "react-i18next";
import { Gauge, Inbox, PackageCheck, Send, Users } from "lucide-react";

import { MetricCard } from "@/components/shared/metric-card";
import { StatisticsAvailability } from "@/components/shared/statistics-availability";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Queue } from "@/domains/queues/queue-schema";

type QueueLiveStateProps = {
  queue: Queue;
  canShowQueueTotals: boolean;
  availabilityReason?: string;
};

export function QueueLiveState({
  queue,
  canShowQueueTotals,
  availabilityReason,
}: QueueLiveStateProps) {
  const { t } = useTranslation();
  const members = queue.members ?? [];
  const online = queue.online ?? [];
  const majorityRequired = Math.floor(members.length / 2) + 1;
  const replicationUnhealthy =
    members.length > 0 && online.length < majorityRequired;
  const capacity = queue.consumer_capacity ?? queue.consumer_utilisation;

  return (
    <section className="space-y-3" aria-labelledby="queue-live-state">
      <div>
        <h2 id="queue-live-state" className="text-base font-semibold">
          {t("queues.liveState")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("queues.liveStateDescription")}
        </p>
      </div>

      {!canShowQueueTotals ? (
        <StatisticsAvailability reason={availabilityReason} />
      ) : null}

      {replicationUnhealthy ? (
        <Alert variant="destructive">
          <AlertTitle>{t("queues.replicationMajorityUnavailable")}</AlertTitle>
          <AlertDescription>
            {t("queues.replicationMajorityUnavailableDescription", {
              online: online.length,
              total: members.length,
            })}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title={t("queues.ready")}
          value={canShowQueueTotals ? (queue.messages_ready ?? 0) : null}
          icon={<Inbox aria-hidden="true" />}
          isUnavailable={!canShowQueueTotals}
          unavailableLabel={t("common.unavailable")}
        />
        <MetricCard
          title={t("queues.unacked")}
          value={
            canShowQueueTotals
              ? (queue.messages_unacknowledged ?? 0)
              : null
          }
          icon={<PackageCheck aria-hidden="true" />}
          status={
            (queue.messages_unacknowledged ?? 0) > 0 ? "warning" : "normal"
          }
          isUnavailable={!canShowQueueTotals}
          unavailableLabel={t("common.unavailable")}
        />
        <MetricCard
          title={t("queues.total")}
          value={canShowQueueTotals ? (queue.messages ?? 0) : null}
          icon={<Send aria-hidden="true" />}
          isUnavailable={!canShowQueueTotals}
          unavailableLabel={t("common.unavailable")}
        />
        <MetricCard
          title={t("queues.consumers")}
          value={queue.consumers ?? 0}
          icon={<Users aria-hidden="true" />}
        />
        <MetricCard
          title={t("queues.consumerCapacity")}
          value={capacity == null ? null : Math.round(capacity * 100)}
          unit={capacity == null ? undefined : "%"}
          icon={<Gauge aria-hidden="true" />}
          isUnavailable={capacity == null}
          unavailableLabel={t("common.unavailable")}
        />
      </div>
    </section>
  );
}
