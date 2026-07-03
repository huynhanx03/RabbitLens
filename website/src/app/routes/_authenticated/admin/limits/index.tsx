import { createFileRoute } from "@tanstack/react-router";
import { LimitListPage } from "@/features/limits/limit-list-page";

export const Route = createFileRoute("/_authenticated/admin/limits/")({
  component: LimitListPage,
});
