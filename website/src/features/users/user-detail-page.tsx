import { useRouteContext, Link, useParams } from "@tanstack/react-router";
import { useUser, useUserPermissions, useUserTopicPermissions } from "@/domains/admin/users/user-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserForm } from "./user-form";
import { useCreateUserMutation, useClearPermissionMutation, useClearTopicPermissionMutation, useSetPermissionMutation, useSetTopicPermissionMutation } from "./user-mutations";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { usePermissionDecision } from "@/auth/permissions/permission-gate";
import { ArrowLeft, Cable, Pencil, Trash2 } from "lucide-react";
import { DeleteUserDialog } from "./delete-user-dialog";
import { PermissionForm } from "./permission-form";
import { TopicPermissionForm } from "./topic-permission-form";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type {
  PermissionResponse,
  TopicPermissionResponse,
  UserBody,
} from "@/domains/admin/users/user-schema";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { AsyncState } from "@/components/shared/async-state";
import { DetailPageHeader } from "@/components/shared/detail-page-header";
import { destructiveIconButtonClassName } from "@/lib/utils";

export function UserDetailPage() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "/_authenticated/admin/users/$name" });
  const { name } = useParams({ from: "/_authenticated/admin/users/$name" });
  
  const { data: user, isPending, isError, error } = useUser(context.apiClient, name);
  const { data: permissions, isPending: isPermPending } = useUserPermissions(context.apiClient, name);
  const { data: topicPermissions, isPending: isTopicPending } = useUserTopicPermissions(context.apiClient, name);

  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPermOpen, setIsPermOpen] = useState(false);
  const [isTopicPermOpen, setIsTopicPermOpen] = useState(false);
  const [permissionToClear, setPermissionToClear] =
    useState<PermissionResponse | null>(null);
  const [topicPermissionToClear, setTopicPermissionToClear] =
    useState<TopicPermissionResponse | null>(null);

  const updateMutation = useCreateUserMutation(context.apiClient);
  const setPermMutation = useSetPermissionMutation(context.apiClient);
  const clearPermMutation = useClearPermissionMutation(context.apiClient);
  const setTopicPermMutation = useSetTopicPermissionMutation(context.apiClient);
  const clearTopicPermMutation = useClearTopicPermissionMutation(context.apiClient);

  const canManageUsers = usePermissionDecision({ requiredAnyTag: ["administrator"] }).kind !== "deny";

  if (isPending) return <Skeleton className="h-[400px] w-full" />;
  if (isError) return <AsyncState isError error={error} onRetry={() => undefined}><span /></AsyncState>;

  const tagsArray = user.tags || [];

  const permColumns: ColumnDef<PermissionResponse>[] = [
    { accessorKey: "vhost", header: "Virtual Host" },
    { accessorKey: "configure", header: "Configure regex" },
    { accessorKey: "write", header: "Write regex" },
    { accessorKey: "read", header: "Read regex" },
    {
      id: "actions",
      cell: ({ row }) => {
        if (!canManageUsers) return null;
        return (
          <Button 
            variant="ghost" 
            size="icon"
            className={destructiveIconButtonClassName}
            onClick={() => setPermissionToClear(row.original)}
            aria-label={`${t("users.clearPermission")} ${row.original.vhost}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        );
      }
    }
  ];

  const topicPermColumns: ColumnDef<TopicPermissionResponse>[] = [
    { accessorKey: "vhost", header: "Virtual Host" },
    { accessorKey: "exchange", header: "Exchange" },
    { accessorKey: "write", header: "Write regex" },
    { accessorKey: "read", header: "Read regex" },
    {
      id: "actions",
      cell: ({ row }) => {
        if (!canManageUsers) return null;
        return (
          <Button 
            variant="ghost" 
            size="icon"
            className={destructiveIconButtonClassName}
            onClick={() => setTopicPermissionToClear(row.original)}
            aria-label={`${t("users.clearTopicPermission")} ${row.original.exchange}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title={name}
        description={t("users.detailDescription")}
        backAction={
          <Button asChild variant="outline" size="icon" aria-label={t("common.back")}>
            <Link to="/admin/users">
              <ArrowLeft aria-hidden="true" />
            </Link>
          </Button>
        }
        metadata={[
          ...(tagsArray.length > 0
            ? tagsArray.map((tag: string) => (
                <Badge key={tag} variant="secondary">{tag.trim()}</Badge>
              ))
            : [<Badge key="no-tags" variant="secondary">{t("users.noTags")}</Badge>]),
          <span key="limits" className="inline-flex items-center gap-2">
            <span>{t("limits.title")}</span>
            <Badge variant="secondary">
              {user.limits ? Object.keys(user.limits).length : 0}
            </Badge>
          </span>,
        ]}
        actions={
          canManageUsers ? (
            <>
            <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
              <DialogTrigger asChild>
                  <Button variant="outline">
                    <Pencil aria-hidden="true" />
                    {t("common.edit")}
                  </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit user</DialogTitle>
                </DialogHeader>
                <MutationErrorAlert error={updateMutation.error} />
                <UserForm 
                  initialValues={{
                    name: user.name,
                    tags: tagsArray.join(", "),
                  }}
                  isUpdate
                  onSubmit={(data) => {
                    const payload: UserBody = { tags: data.tags };
                    if (data.password) payload.password = data.password;
                    updateMutation.mutate(
                      { name: name, body: payload },
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

            <DeleteUserDialog 
              name={name}
              open={isDeleteOpen}
              onOpenChange={setIsDeleteOpen}
              apiClient={context.apiClient}
            />
            </>
          ) : undefined
        }
      />

      <nav aria-label={t("common.resources")} className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to="/connections" search={{ page: 1, pageSize: 100, name, useRegex: false, sortReverse: false }}>
            <Cable aria-hidden="true" />
            {t("nav.connections")}
          </Link>
        </Button>
      </nav>

      <div className="space-y-4 pt-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight">Permissions</h2>
          {canManageUsers && (
            <Dialog open={isPermOpen} onOpenChange={setIsPermOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Set permission</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set permission for {name}</DialogTitle>
                </DialogHeader>
                <MutationErrorAlert error={setPermMutation.error} />
                <PermissionForm 
                  apiClient={context.apiClient}
                  onSubmit={(vhost, data) => {
                    setPermMutation.mutate(
                      { user: name, vhost, body: data },
                      { onSuccess: () => setIsPermOpen(false) }
                    );
                  }}
                  isLoading={setPermMutation.isPending}
                  onCancel={() => setIsPermOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
        {isPermPending ? <Skeleton className="h-[200px] w-full" /> : (
          <DataTable columns={permColumns} data={permissions || []} />
        )}
      </div>

      <div className="space-y-4 pt-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight">Topic Permissions</h2>
          {canManageUsers && (
            <Dialog open={isTopicPermOpen} onOpenChange={setIsTopicPermOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Set topic permission</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set topic permission for {name}</DialogTitle>
                </DialogHeader>
                <MutationErrorAlert error={setTopicPermMutation.error} />
                <TopicPermissionForm 
                  apiClient={context.apiClient}
                  onSubmit={(vhost, data) => {
                    setTopicPermMutation.mutate(
                      { user: name, vhost, body: data },
                      { onSuccess: () => setIsTopicPermOpen(false) }
                    );
                  }}
                  isLoading={setTopicPermMutation.isPending}
                  onCancel={() => setIsTopicPermOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
        {isTopicPending ? <Skeleton className="h-[200px] w-full" /> : (
          <DataTable columns={topicPermColumns} data={topicPermissions || []} />
        )}
      </div>

      <ConfirmDialog
        open={permissionToClear !== null}
        onOpenChange={(open) => !open && setPermissionToClear(null)}
        title={t("users.clearPermission")}
        description={t("users.clearPermissionWarning", {
          user: name,
          vhost: permissionToClear?.vhost,
        })}
        confirmText={t("users.clear")}
        variant="destructive"
        isConfirming={clearPermMutation.isPending}
        error={clearPermMutation.error}
        onConfirm={() => {
          if (!permissionToClear) return;
          clearPermMutation.mutate(
            { user: name, vhost: permissionToClear.vhost },
            { onSuccess: () => setPermissionToClear(null) },
          );
        }}
      />

      <ConfirmDialog
        open={topicPermissionToClear !== null}
        onOpenChange={(open) => !open && setTopicPermissionToClear(null)}
        title={t("users.clearTopicPermission")}
        description={t("users.clearTopicPermissionWarning", {
          user: name,
          vhost: topicPermissionToClear?.vhost,
          exchange: topicPermissionToClear?.exchange,
        })}
        confirmText={t("users.clear")}
        variant="destructive"
        isConfirming={clearTopicPermMutation.isPending}
        error={clearTopicPermMutation.error}
        onConfirm={() => {
          if (!topicPermissionToClear) return;
          clearTopicPermMutation.mutate(
            {
              user: name,
              vhost: topicPermissionToClear.vhost,
              exchange: topicPermissionToClear.exchange,
            },
            { onSuccess: () => setTopicPermissionToClear(null) },
          );
        }}
      />

    </div>
  );
}
