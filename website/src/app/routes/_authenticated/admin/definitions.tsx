import { createFileRoute } from "@tanstack/react-router";
import { DefinitionAdminPage } from "@/features/definitions/definition-admin-page";

export const Route = createFileRoute("/_authenticated/admin/definitions")({
  component: DefinitionAdminPage,
});
