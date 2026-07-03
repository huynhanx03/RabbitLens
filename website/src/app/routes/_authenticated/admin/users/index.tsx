import { createFileRoute } from "@tanstack/react-router";
import { UserListPage } from "@/features/users/user-list-page";

export const Route = createFileRoute("/_authenticated/admin/users/")({
  component: UserListPage,
});
