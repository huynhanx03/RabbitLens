import { useRouteContext, Link, useParams } from "@tanstack/react-router";
import { useVhost } from "@/domains/admin/vhosts/vhost-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DefinitionList, type DefinitionItem } from "@/components/shared/definition-list";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VhostForm } from "./vhost-form";
import { useCreateVhostMutation } from "./vhost-mutations";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { usePermissionDecision } from "@/auth/permissions/permission-gate";
import { Trash2, Power } from "lucide-react";
import { DeleteVhostDialog } from "./delete-vhost-dialog";
import { RestartVhostDialog } from "./restart-vhost-dialog";
import { AsyncState } from "@/components/shared/async-state";
import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { useTranslation } from "react-i18next";

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

  const definitionItems: DefinitionItem[] = [
    { label: "Description", value: vhost.description },
    { 
      label: "Tags", 
      value: (
        <div className="flex gap-1 flex-wrap">
          {vhost.tags && vhost.tags.length > 0 ? (
            vhost.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)
          ) : "-"}
        </div>
      )
    },
    { label: "Default Queue Type", value: vhost.default_queue_type },
    { label: "Tracing", value: vhost.tracing ? "Yes" : "No" }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <DetailPageHeader title={name} description={t("vhosts.detailDescription")} />
        {canManageVhosts && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setIsRestartOpen(true)}>
              <Power className="h-4 w-4 text-orange-500" />
            </Button>
            <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Edit</Button>
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

            <Button variant="destructive" size="icon" onClick={() => setIsDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
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
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <h3 className="font-semibold leading-none tracking-tight mb-4">Details</h3>
            <DefinitionList items={definitionItems} unavailableLabel="-" />
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <h3 className="font-semibold leading-none tracking-tight mb-4">Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/queues" search={{ page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false, vhost: name }} className="text-primary hover:underline">
                  View Queues
                </Link>
              </li>
              <li>
                <Link to="/exchanges" search={{ page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false, vhost: name }} className="text-primary hover:underline">
                  View Exchanges
                </Link>
              </li>
              <li>
                <Link to="/connections" search={{ page: 1, pageSize: 100, name: "", useRegex: false, sortReverse: false }} className="text-primary hover:underline">
                  View Connections
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
