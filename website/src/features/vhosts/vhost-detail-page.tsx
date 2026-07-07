import { useRouteContext, Link, useParams } from "@tanstack/react-router";
import { useVhost } from "@/domains/admin/vhosts/vhost-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VhostForm } from "./vhost-form";
import { useCreateVhostMutation } from "./vhost-mutations";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { usePermissionDecision } from "@/auth/permissions/permission-gate";
import {
  ArrowLeft,
  Cable,
  ListTree,
  Pencil,
  Power,
  Trash2,
  Waypoints,
} from "lucide-react";
import { DeleteVhostDialog } from "./delete-vhost-dialog";
import { RestartVhostDialog } from "./restart-vhost-dialog";
import { AsyncState } from "@/components/shared/async-state";
import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { useTranslation } from "react-i18next";
import { destructiveIconButtonClassName } from "@/lib/utils";

export function VhostDetailPage() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "/_authenticated/admin/vhosts/$name" });
  const { name } = useParams({ from: "/_authenticated/admin/vhosts/$name" });
  const { data: vhost, isPending, isError, error } = useVhost(context.apiClient, name);

  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRestartOpen, setIsRestartOpen] = useState(false);

  const canManageVhosts = usePermissionDecision({ requiredAnyTag: ["administrator"] }).kind !== "deny";

  const updateMutation = useCreateVhostMutation(context.apiClient);

  if (isPending) return <Skeleton className="h-[400px] w-full" />;
  if (isError) return <AsyncState isError error={error} onRetry={() => undefined}><span /></AsyncState>;

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title={name}
        description={vhost.description || t("vhosts.detailDescription")}
        backAction={
          <Button asChild variant="outline" size="icon" aria-label={t("common.back")}>
            <Link to="/admin/vhosts">
              <ArrowLeft aria-hidden="true" />
            </Link>
          </Button>
        }
        metadata={[
          <span key="queue-type" className="inline-flex items-center gap-2">
            <span>{t("vhosts.defaultQueueType")}</span>
            <Badge variant="secondary">{vhost.default_queue_type}</Badge>
          </span>,
          <span key="tracing" className="inline-flex items-center gap-2">
            <span>{t("vhosts.tracing")}</span>
            <Badge variant={vhost.tracing ? "default" : "secondary"}>
              {vhost.tracing ? t("common.yes") : t("common.no")}
            </Badge>
          </span>,
          ...(vhost.tags ?? []).map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          )),
        ]}
        actions={
          canManageVhosts ? (
            <>
              <Button variant="outline" onClick={() => setIsRestartOpen(true)}>
                <Power aria-hidden="true" className="rl-action-warning" />
                {t("common.restart")}
              </Button>
            <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
              <DialogTrigger asChild>
                  <Button variant="outline">
                    <Pencil aria-hidden="true" />
                    {t("common.edit")}
                  </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit virtual host</DialogTitle>
                </DialogHeader>
                <MutationErrorAlert error={updateMutation.error} />
                <VhostForm 
                  initialValues={vhost}
                  isUpdate
                  onSubmit={(data) => {
                    updateMutation.mutate(
                      { name: name, body: data },
                      { onSuccess: () => setIsUpdateOpen(false) }
                    );
                  }} 
                  isLoading={updateMutation.isPending}
                  onCancel={() => setIsUpdateOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="icon"
              className={destructiveIconButtonClassName}
              onClick={() => setIsDeleteOpen(true)}
                aria-label={t("common.delete")}
            >
                <Trash2 aria-hidden="true" />
            </Button>

            <DeleteVhostDialog 
              name={name}
              open={isDeleteOpen}
              onOpenChange={setIsDeleteOpen}
              apiClient={context.apiClient}
            />
            
            <RestartVhostDialog 
              vhost={vhost}
              open={isRestartOpen}
              onOpenChange={setIsRestartOpen}
              apiClient={context.apiClient}
            />
            </>
          ) : undefined
        }
      />

      <nav
        aria-label={t("common.resources")}
        className="flex flex-wrap items-center gap-3"
      >
        <Button asChild variant="outline">
          <Link to="/queues" search={{ page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false, vhost: name }}>
            <ListTree aria-hidden="true" />
            {t("nav.queues")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/exchanges" search={{ page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false, vhost: name }}>
            <Waypoints aria-hidden="true" />
            {t("nav.exchanges")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/connections" search={{ page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false }}>
            <Cable aria-hidden="true" />
            {t("nav.connections")}
          </Link>
        </Button>
      </nav>
    </div>
  );
}
