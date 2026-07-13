import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CreateBindingDialog, type BindingMode } from "./create-binding-dialog";
import { createBindingColumns } from "./binding-columns";
import {
  getExchangeBindingsSource,
  getExchangeBindingsDestination,
  getQueueBindings,
} from "@/domains/bindings/binding-api";
import type { Binding } from "@/domains/bindings/binding-schema";
import { bindingKeys, useDeleteBindingMutation } from "@/domains/bindings/binding-query";
import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";

export interface BindingListProps {
  vhost: string;
  resourceName: string;
  mode: BindingMode;
}

export function BindingList({ vhost, resourceName, mode }: BindingListProps) {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [bindingToDelete, setBindingToDelete] = useState<Binding | null>(null);

  const deleteMutation = useDeleteBindingMutation(context.apiClient);

  const queryKey =
    mode === "to-queue"
      ? bindingKeys.queue(vhost, resourceName)
      : mode === "to-exchange"
        ? bindingKeys.exchangeDestination(vhost, resourceName)
        : bindingKeys.exchangeSource(vhost, resourceName);

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: ({ signal }) => {
      if (mode === "to-queue") {
        return getQueueBindings(context.apiClient, vhost, resourceName, signal);
      } else if (mode === "to-exchange") {
        return getExchangeBindingsDestination(context.apiClient, vhost, resourceName, signal);
      } else {
        return getExchangeBindingsSource(context.apiClient, vhost, resourceName, signal);
      }
    },
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs),
  });

  const columns = useMemo(
    () => createBindingColumns(t, setBindingToDelete, mode),
    [t, mode]
  );

  const title =
    mode === "to-queue"
      ? t("bindings.title")
      : mode === "to-exchange"
        ? t("bindings.bindingsToExchange")
        : t("bindings.bindingsFromExchange");

  return (
    <section className="space-y-3" aria-label={title}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm">
          {mode === "from-exchange" ? t("bindings.bindTo") : t("bindings.bindFrom")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
      />

      <CreateBindingDialog
        vhost={vhost}
        resourceName={resourceName}
        mode={mode}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <ConfirmDialog
        open={!!bindingToDelete}
        onOpenChange={(open) => !open && setBindingToDelete(null)}
        title={t("bindings.removeBinding")}
        description={
          bindingToDelete && (
            <>
              {t("bindings.removeConfirm")}{" "}
              <strong>{bindingToDelete.source === "" ? "(AMQP default)" : bindingToDelete.source}</strong> {t("bindings.and")}{" "}
              <strong>{bindingToDelete.destination}</strong>?
            </>
          )
        }
        confirmText={t("common.remove")}
        variant="destructive"
        isConfirming={deleteMutation.isPending}
        error={deleteMutation.error}
        onConfirm={() => {
          if (bindingToDelete) {
            deleteMutation.mutate(
              {
                vhost,
                exchange: bindingToDelete.source,
                destinationType: bindingToDelete.destination_type === "queue" ? "q" : "e",
                destination: bindingToDelete.destination,
                propertiesKey: bindingToDelete.properties_key,
              },
              {
                onSuccess: () => setBindingToDelete(null),
              }
            );
          }
        }}
      />
    </section>
  );
}
