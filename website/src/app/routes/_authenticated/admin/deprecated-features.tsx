import { createFileRoute } from "@tanstack/react-router";
import { DeprecatedFeatureListPage } from "@/features/deprecated-features/deprecated-feature-list-page";

export const Route = createFileRoute("/_authenticated/admin/deprecated-features")({
  component: DeprecatedFeatureListPage,
});
