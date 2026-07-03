import { createFileRoute } from "@tanstack/react-router";
import { FeatureFlagListPage } from "@/features/feature-flags/feature-flag-list-page";

export const Route = createFileRoute("/_authenticated/admin/feature-flags")({
  component: FeatureFlagListPage,
});
