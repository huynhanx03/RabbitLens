import { useRouteContext, Link } from "@tanstack/react-router";
import { useUsers } from "@/domains/admin/users/user-query";
import { DataTable } from "@/components/shared/data-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserForm } from "./user-form";
import { useCreateUserMutation } from "./user-mutations";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { usePermissionDecision } from "@/auth/permissions/permission-gate";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import type { UserResponse } from "@/domains/admin/users/user-schema";
import { AsyncState } from "@/components/shared/async-state";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { useTranslation } from "react-i18next";

export function UserListPage() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "/_authenticated/admin/users/" });
  const { data: users, isPending, isError, error } = useUsers(context.apiClient);
  const [filter, setFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createMutation = useCreateUserMutation(context.apiClient);

  const canManageUsers = usePermissionDecision({ requiredAnyTag: ["administrator"] }).kind !== "deny";

  if (isPending) return <Skeleton className="h-[400px] w-full" />;
  if (isError) return <AsyncState isError error={error} onRetry={() => undefined}><span /></AsyncState>;

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(filter.toLowerCase())
  );

  const columns: ColumnDef<UserResponse>[] = [
    {
      accessorKey: "name",
      header: t("users.name"),
      cell: ({ row }) => (
        <Link 
          to="/admin/users/$name"
          params={{ name: row.original.name }}
          className="text-primary hover:underline font-medium"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "tags",
      header: t("users.tags"),
      cell: ({ row }) => {
        const tags = row.original.tags;
        if (!tags) return null;
        const tagsArray = tags || [];
        return (
          <div className="flex gap-1 flex-wrap">
            {tagsArray.map((tag: string) => (
              <Badge key={tag} variant="secondary">{tag.trim()}</Badge>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {canManageUsers && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>{t("users.addUser")}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t("users.createTitle")}</DialogTitle>
              </DialogHeader>
              <MutationErrorAlert error={createMutation.error} />
              <UserForm 
                onSubmit={(data) => {
                  createMutation.mutate(
                    { name: data.name, body: { password: data.password, tags: data.tags } },
                    { onSuccess: () => setIsCreateOpen(false) }
                  );
                }} 
                isLoading={createMutation.isPending}
                onCancel={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <PageToolbar ariaLabel={t("users.filter")} primary={
        <FilterBar 
          name={filter}
          useRegex={false}
          onSubmit={(name, _) => setFilter(name)}
        />
      } />

      <DataTable ariaLabel={t("users.title")} columns={columns} data={filteredUsers} getRowId={(user) => user.name} />
    </div>
  );
}
