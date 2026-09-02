import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AsyncState } from "./async-state";
import { ConfirmDialog } from "./confirm-dialog";
import { DataTable } from "./data-table";
import { JsonParameterForm } from "./json-parameter-form";
import { MutationErrorAlert } from "./mutation-error-alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { destructiveIconButtonClassName } from "@/lib/utils";

type ParameterRecord = {
  vhost: string;
  name: string;
  value: Record<string, unknown>;
};

type ParameterInput = {
  vhost: string;
  name: string;
  value: Record<string, unknown>;
};

type MutationCallbacks = { onSuccess: () => void };

type ParameterManagementPageProps<T extends ParameterRecord> = {
  addLabel: string;
  emptyTitle: string;
  deleteTitle: string;
  deleteDescription: (name: string) => string;
  tableLabel: string;
  detailPath: string;
  defaultValue: Record<string, unknown>;
  data: T[] | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  vhosts: string[];
  saveError: unknown;
  isSaving: boolean;
  onSave: (input: ParameterInput, callbacks: MutationCallbacks) => void;
  deleteError: unknown;
  isDeleting: boolean;
  onDelete: (target: T, callbacks: MutationCallbacks) => void;
  redactValue: (value: T["value"]) => unknown;
};

export function ParameterManagementPage<T extends ParameterRecord>({
  addLabel,
  emptyTitle,
  deleteTitle,
  deleteDescription,
  tableLabel,
  detailPath,
  defaultValue,
  data,
  isPending,
  isError,
  error,
  onRetry,
  vhosts,
  saveError,
  isSaving,
  onSave,
  deleteError,
  isDeleting,
  onDelete,
  redactValue,
}: ParameterManagementPageProps<T>) {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const columns: ColumnDef<T>[] = [
    { accessorKey: "vhost", header: t("vhosts.title") },
    { accessorKey: "name", header: t("common.name") },
    {
      id: "value",
      header: t("common.value"),
      cell: ({ row }) => (
        <code className="block max-w-md truncate text-xs">
          {JSON.stringify(redactValue(row.original.value))}
        </code>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button asChild variant="ghost" size="icon">
            <Link
              to={detailPath}
              params={{ vhost: row.original.vhost, name: row.original.name }}
              aria-label={`${t("common.edit")} ${row.original.name}`}
            >
              <Pencil aria-hidden="true" />
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={destructiveIconButtonClassName}
            onClick={() => setDeleteTarget(row.original)}
            aria-label={`${t("common.delete")} ${row.original.name}`}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden="true" />
          {addLabel}
        </Button>
      </div>
      <AsyncState
        isPending={isPending}
        isError={isError}
        error={error}
        onRetry={onRetry}
        isEmpty={!isPending && data?.length === 0}
        emptyTitle={emptyTitle}
      >
        <DataTable
          ariaLabel={tableLabel}
          columns={columns}
          data={data ?? []}
          getRowId={(row) => `${row.vhost}:${row.name}`}
        />
      </AsyncState>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{addLabel}</DialogTitle>
          </DialogHeader>
          <MutationErrorAlert error={saveError} />
          <JsonParameterForm
            vhosts={vhosts}
            initialValue={defaultValue}
            isPending={isSaving}
            onCancel={() => setCreateOpen(false)}
            onSubmit={(input) => onSave(input, { onSuccess: () => setCreateOpen(false) })}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTitle}
        description={deleteDescription(deleteTarget?.name ?? "")}
        confirmText={t("common.delete")}
        variant="destructive"
        isConfirming={isDeleting}
        error={deleteError}
        onConfirm={() => {
          if (!deleteTarget) return;
          onDelete(deleteTarget, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
    </div>
  );
}
