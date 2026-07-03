import { createFileRoute } from "@tanstack/react-router";
import { UserDetailPage } from "@/features/users/user-detail-page";

export const Route = createFileRoute("/_authenticated/admin/users/$name")({
  component: UserDetailPage,
});
