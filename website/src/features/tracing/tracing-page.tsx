import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AsyncState } from "@/components/shared/async-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  traceFilePath,
  type Trace,
  type TraceFile,
} from "@/domains/extensions/tracing/tracing-api";
import {
  traceFilesQueryOptions,
  tracesQueryOptions,
  useCreateTrace,
  useDeleteTrace,
  useDeleteTraceFile,
} from "@/domains/extensions/tracing/tracing-query";
import { nodesListQueryOptions } from "@/domains/nodes/nodes-query";
import { useVhosts } from "@/domains/admin/vhosts/vhost-query";
import { formatBytes } from "@/lib/utils";
import { TraceForm } from "./trace-form";

type TraceTarget = { node: string; vhost: string; name: string };

export function TracingPage() {
  const { t } = useTranslation();
  const { apiClient } = useRouteContext({ from: "__root__" });
  const nodes = useQuery(nodesListQueryOptions(apiClient, () => true));
  const vhosts = useVhosts(apiClient);
  const [node, setNode] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [traceToDelete, setTraceToDelete] = useState<TraceTarget | null>(null);
  const [fileToDelete, setFileToDelete] = useState<TraceFile | null>(null);

  useEffect(() => {
    if (!node && nodes.data?.[0]) setNode(nodes.data[0].name);
  }, [node, nodes.data]);

  const traces = useQuery(tracesQueryOptions(apiClient, node));
  const files = useQuery(traceFilesQueryOptions(apiClient, node));
  const createMutation = useCreateTrace(apiClient);
  const deleteTraceMutation = useDeleteTrace(apiClient);
  const deleteFileMutation = useDeleteTraceFile(apiClient);

  const downloadFile = useCallback(async (file: TraceFile) => {
    const blob = await apiClient.requestBlob(traceFilePath(node, file.name));
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [apiClient, node]);

  const traceColumns = useMemo<ColumnDef<Trace>[]>(
    () => [
      { accessorKey: "vhost", header: t("tracing.vhost") },
      {
        accessorKey: "name",
        header: t("tracing.name"),
        cell: ({ row }) => (
          <Link
            to="/extensions/tracing/$node/$vhost/$name"
            params={{ node, vhost: row.original.vhost, name: row.original.name }}
            className="font-medium text-primary hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: "format",
        header: t("tracing.format"),
        cell: ({ row }) => <Badge variant="outline">{row.original.format}</Badge>,
      },
      {
        accessorKey: "pattern",
        header: t("tracing.pattern"),
        cell: ({ row }) => <code className="rounded bg-muted px-1.5 py-0.5">{row.original.pattern}</code>,
      },
      { accessorKey: "max_payload_bytes", header: t("tracing.maxPayloadBytes") },
      {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${t("tracing.stopTrace")} ${row.original.name}`}
            onClick={() => setTraceToDelete({ node, vhost: row.original.vhost, name: row.original.name })}
          >
            <Trash2 className="text-destructive" aria-hidden="true" />
          </Button>
        ),
      },
    ],
    [node, t],
  );

  const fileColumns = useMemo<ColumnDef<TraceFile>[]>(
    () => [
      { accessorKey: "name", header: t("tracing.file") },
      {
        accessorKey: "size",
        header: t("tracing.size"),
        cell: ({ row }) => formatBytes(row.original.size ?? 0),
      },
      {
        accessorKey: "mtime",
        header: t("tracing.lastModified"),
        cell: ({ row }) => row.original.mtime ? new Date(row.original.mtime).toLocaleString() : "—",
      },
      {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${t("tracing.downloadFile")} ${row.original.name}`}
              onClick={() => void downloadFile(row.original)}
            >
              <Download aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${t("tracing.deleteFile")} ${row.original.name}`}
              onClick={() => setFileToDelete(row.original)}
            >
              <Trash2 className="text-destructive" aria-hidden="true" />
            </Button>
          </div>
        ),
      },
    ],
    [downloadFile, t],
  );

  return (
    <div className="space-y-4">
      <PageToolbar
        ariaLabel={t("tracing.nodeFilter")}
        primary={
          <Select value={node} onValueChange={setNode} disabled={nodes.isPending}>
            <SelectTrigger aria-label={t("tracing.node")} className="min-w-56">
              <SelectValue placeholder={t("tracing.selectNode")} />
            </SelectTrigger>
            <SelectContent>
              {nodes.data?.map((item) => (
                <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        secondary={
          <Button onClick={() => setAddOpen(true)} disabled={!node}>
            <Plus aria-hidden="true" /> {t("tracing.addTrace")}
          </Button>
        }
      />
      <Tabs defaultValue="traces">
        <TabsList>
          <TabsTrigger value="traces">{t("tracing.traces")}</TabsTrigger>
          <TabsTrigger value="files">{t("tracing.logFiles")}</TabsTrigger>
        </TabsList>
        <TabsContent value="traces" className="pt-2">
          <AsyncState
            isPending={nodes.isPending || traces.isPending}
            isError={nodes.isError || traces.isError}
            error={nodes.error ?? traces.error}
            onRetry={() => { void nodes.refetch(); void traces.refetch(); }}
            isEmpty={!traces.isPending && traces.data?.length === 0}
            emptyTitle={t("tracing.emptyTraces")}
          >
            <DataTable ariaLabel={t("tracing.traces")} columns={traceColumns} data={traces.data ?? []} getRowId={(trace) => `${trace.vhost}:${trace.name}`} />
          </AsyncState>
        </TabsContent>
        <TabsContent value="files" className="pt-2">
          <AsyncState
            isPending={nodes.isPending || files.isPending}
            isError={nodes.isError || files.isError}
            error={nodes.error ?? files.error}
            onRetry={() => { void nodes.refetch(); void files.refetch(); }}
            isEmpty={!files.isPending && files.data?.length === 0}
            emptyTitle={t("tracing.emptyFiles")}
          >
            <DataTable ariaLabel={t("tracing.logFiles")} columns={fileColumns} data={files.data ?? []} getRowId={(file) => file.name} />
          </AsyncState>
        </TabsContent>
      </Tabs>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tracing.addTrace")}</DialogTitle>
            <DialogDescription>{t("tracing.addDescription", { node })}</DialogDescription>
          </DialogHeader>
          <MutationErrorAlert error={createMutation.error} />
          <TraceForm
            vhosts={vhosts.data ?? []}
            isPending={createMutation.isPending || vhosts.isPending}
            onCancel={() => setAddOpen(false)}
            onSubmit={({ vhost, name, body }) =>
              createMutation.mutate(
                { node, vhost, name, body },
                { onSuccess: () => setAddOpen(false) },
              )
            }
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={traceToDelete !== null}
        onOpenChange={(open) => !open && setTraceToDelete(null)}
        title={t("tracing.stopTrace")}
        description={t("tracing.deleteTraceConfirm")}
        confirmText={t("tracing.stopTrace")}
        isConfirming={deleteTraceMutation.isPending}
        error={deleteTraceMutation.error}
        onConfirm={() => traceToDelete && deleteTraceMutation.mutate(traceToDelete, { onSuccess: () => setTraceToDelete(null) })}
      />
      <ConfirmDialog
        open={fileToDelete !== null}
        onOpenChange={(open) => !open && setFileToDelete(null)}
        title={t("tracing.deleteFile")}
        description={t("tracing.deleteFileConfirm")}
        confirmText={t("tracing.deleteFile")}
        isConfirming={deleteFileMutation.isPending}
        error={deleteFileMutation.error}
        onConfirm={() => fileToDelete && deleteFileMutation.mutate({ node, name: fileToDelete.name }, { onSuccess: () => setFileToDelete(null) })}
      />
    </div>
  );
}
